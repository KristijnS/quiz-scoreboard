const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const serve = require('electron-serve');

let mainWindow;
let backendProcess;
let settings = { devToolsEnabled: false };

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
    try {
        const data = require('fs').readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(data);
    } catch (e) {
        // ignore, defaults will be used
    }
}

function saveSettings() {
    try {
        require('fs').writeFileSync(settingsPath, JSON.stringify(settings), 'utf8');
    } catch (e) {
        console.error('Failed to save settings', e);
    }
}

// Setup electron-serve for production
// In packaged mode, serve from the Resources directory
const isDev = !app.isPackaged;
const loadURL = serve({ 
    directory: isDev 
        ? path.join(__dirname, '../frontend/dist')
        : path.join(process.resourcesPath, 'frontend/dist')
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // Load the frontend
    // In production, load from built files
    // In development, you can load from localhost:5173
    
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // open devtools in development only if setting enabled
        if (settings.devToolsEnabled) mainWindow.webContents.openDevTools();
    } else {
        // Use electron-serve to load the app
        loadURL(mainWindow);
        // open devtools only if enabled in settings
        if (settings.devToolsEnabled) mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackendServer() {
    const isDev = !app.isPackaged;
    
    if (isDev) {
        // In development, run the TypeScript backend with ts-node
        backendProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, '../backend'),
            shell: true,
            stdio: 'inherit'
        });
    } else {
        // In production, run the compiled JavaScript backend from Resources
        const backendPath = path.join(process.resourcesPath, 'backend/dist/index.js');
        backendProcess = spawn('node', [backendPath], {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'production'
            }
        });
    }

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

// Check if backend is ready by polling the API
function waitForBackend(callback, maxAttempts = 30) {
    let attempts = 0;
    const http = require('http');
    
    const check = () => {
        attempts++;
        const req = http.get('http://localhost:3000/', (res) => {
            if (res.statusCode === 200) {
                console.log('Backend is ready');
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, 200);
            } else {
                console.error('Backend failed to start after', attempts, 'attempts');
                callback(); // Still create window to show error
            }
        });
        
        req.on('error', () => {
            if (attempts < maxAttempts) {
                setTimeout(check, 200);
            } else {
                console.error('Backend failed to start after', attempts, 'attempts');
                callback(); // Still create window to show error
            }
        });
    };
    
    check();
}

app.whenReady().then(() => {
    loadSettings();
    // Start the backend server first
    startBackendServer();
    
    // Wait for backend to be ready before creating window
    waitForBackend(() => {
        createWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// IPC handler to toggle devtools from renderer
ipcMain.on('devtools-toggle', (event, enabled) => {
    settings.devToolsEnabled = !!enabled;
    saveSettings();
    if (mainWindow && mainWindow.webContents) {
        if (settings.devToolsEnabled) mainWindow.webContents.openDevTools();
        else mainWindow.webContents.closeDevTools();
    }
});

app.on('window-all-closed', () => {
    // Kill the backend process when the app closes
    if (backendProcess) {
        backendProcess.kill();
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Ensure backend process is killed
    if (backendProcess) {
        backendProcess.kill();
    }
});
