const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Basic info
    platform: process.platform,
    versions: process.versions,

    // Toggle devtools in the main process
    toggleDevTools: (enabled) => ipcRenderer.send('devtools-toggle', !!enabled),

    // Optional: request current devtools state (renderer can track via localStorage)
    // You could expand this to provide settings from main in future.
});
