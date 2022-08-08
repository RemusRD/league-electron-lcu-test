// Native
import { join } from 'path';
import LCUConnector from 'lcu-connector';
import fetch from 'electron-fetch';

// Packages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import * as electron from "electron";

electron.app.commandLine.appendSwitch('ignore-certificate-errors')

const height = 400;
const width = 600;
let clientConnected = false;
let riotCredentials: any = null;

function createWindow() {
  // Create the browser window.
  const window: BrowserWindow = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  // window.webContents.openDevTools();

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
  });
  return window;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const winApp = createWindow();
  const connector = new LCUConnector();
  connector.on('connect', async (data) => {
    winApp.webContents.send('clientStatus', { connected: true });
    clientConnected = true;
    riotCredentials = data;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const base64Creds = Buffer.from(`riot:${riotCredentials.password}`).toString('base64');
    const response = await fetch(`https://127.0.0.1:${riotCredentials.port}/lol-summoner/v1/current-summoner`, {
      headers: { Authorization: `Basic ${base64Creds}` }
    });
    const summonerInfo = await response.json();
    console.log(summonerInfo);
    winApp.webContents.send('summonerInfo', {
      id : summonerInfo.accountId,
      name: summonerInfo.displayName,
      level : summonerInfo.summonerLevel
    });


  });
  connector.on('disconnect', () => {
    console.log('disconnected');
    winApp.webContents.send('clientStatus', { connected: false });
    clientConnected = false;
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  connector.start();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('message', (event, message: any) => {
  if (message === 'clientStatusCheck') {
    event.sender.send('clientStatus', { connected: clientConnected });
  }
});
