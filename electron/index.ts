// @ts-nocheck
import { join } from 'path';

// Packages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as electron from 'electron';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import TftAdapter from './TFTAdapter';
import TwitchAdapter from './TwitchAdapter';

electron.app.commandLine.appendSwitch('ignore-certificate-errors');

const height = 400;
const width = 600;
let winApp: any = null;

const tftAdapter = new TftAdapter();
const twitchAdapter = new TwitchAdapter();

function createWindow() {
  const window: BrowserWindow = new BrowserWindow({
    width,
    height,
    frame: true,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../src/out/index.html');
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  return window;
}

app.whenReady().then(async () => {
  winApp = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

onIpcMessage('tft-connect', async () => {
  await tftAdapter.connect(twitchAdapter);
  console.log('tft connected');
  const currentSummoner = await tftAdapter.getCurrentSummoner();
  winApp.webContents.send('tft-connected', currentSummoner);
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
