// @ts-nocheck
import { join } from 'path';
// Packages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as electron from 'electron';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import { autoUpdater } from 'electron-updater';
import TftAdapter from './TFTAdapter';
import TwitchAdapter from './TwitchAdapter';

const log = require('electron-log');

const { app } = electron;

console.log = log.log;

electron.app.commandLine.appendSwitch('ignore-certificate-errors');

const height = 400;
const width = 600;
let winApp: any = null;

const twitchAdapter = new TwitchAdapter();
const tftAdapter = new TftAdapter(
  twitchAdapter,
  async () => {
    const currentSummoner = await tftAdapter.getCurrentSummoner();
    console.log('current summoner:::', currentSummoner);
    winApp.webContents.send('tft-connected', currentSummoner);
  },
  async () => {
    winApp.webContents.send('tft-disconnected');
  }
);

function createWindow() {
  const window: BrowserWindow = new BrowserWindow({
    width,
    height,
    frame: true,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
  return window;
}

app.whenReady().then(async () => {
  winApp = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  winApp.webContents.on('did-finish-load', () => {
    winApp.webContents.send('app-version', app.getVersion());
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

onIpcMessage('twitch-connect', async () => {
  const twitchUser = await twitchAdapter.connect(twitchAdapter);
  console.log('twitch connected');
  winApp.webContents.send('twitch-connected', twitchUser);
});

onIpcMessage('enable-predictions', async () => {
  console.log('predictions enabled');
  // tftAdapter.onGameStarted(() => twitchAdapter.helloChat("Game started"));
  // tftAdapter.onGameEnded(() => twitchAdapter.helloChat("Game ended"));
});

function onIpcMessage(messageName: string, listener: () => void) {
  ipcMain.on('message', async (event, message: any) => {
    if (message === messageName) {
      listener(event, message);
    }
  });
}

autoUpdater.on('update-available', (_event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Ok'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version is being downloaded.'
  };
  console.log('update available');
  dialog.showMessageBox(dialogOpts, (response) => {
    console.log(response);
  });
});

autoUpdater.on('update-downloaded', (_event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };
  console.log('update-downloaded');
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});
