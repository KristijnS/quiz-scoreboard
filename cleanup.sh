#!/bin/bash

# Script to clean up development servers
echo "🧹 Cleaning up development processes..."

# Kill backend servers
pkill -f "npm run dev:backend" 2>/dev/null
pkill -f "ts-node.*backend" 2>/dev/null

# Kill frontend servers  
pkill -f "npm run dev:frontend" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Kill electron processes
pkill -f "electron" 2>/dev/null

# Kill processes on ports
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null

echo "✅ Cleanup complete!"
