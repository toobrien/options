const { app, BrowserWindow } = require('electron');
require('electron-reload')(__dirname);

app.on("ready", () => {
  const win = new BrowserWindow({
    width: 640,
    height: 480,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile("data/index.html");
  win.webContents.openDevTools();
});
