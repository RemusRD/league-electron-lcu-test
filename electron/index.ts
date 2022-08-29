// @ts-nocheck
import {join} from 'path';
import fetch from 'electron-fetch';

// Packages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as electron from 'electron';
import {app, BrowserWindow, ipcMain} from 'electron';
import isDev from 'electron-is-dev';
import {ElectronAuthProvider} from '@twurple/auth-electron';
import {clientId} from './config';
import TftAdapter from "./TFTAdapter";

electron.app.commandLine.appendSwitch('ignore-certificate-errors');

const height = 400;
const width = 600;
let riotCredentials: any = null;
let winApp: any = null;
let twitchUser: any = null;

const tftAdapter = new TftAdapter();

const authProvider = new ElectronAuthProvider({
  clientId,
  redirectUri: 'http://localhost:3000/auth/callback'
});

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

// "tft-connect"

// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  winApp = createWindow();
  // const twitchCredentials = await authProvider.getAccessToken([
  //   'chat:edit',
  //   'chat:read',
  //   'user:read:email',
  //   'channel:manage:predictions'
  // ]);
  // const apiClient = new ApiClient({ authProvider });
  // twitchUser = await apiClient.users.getMe();
  // winApp.webContents.send('twitchConnection', {
  //   twitchUserId: twitchUser.id,
  //   username: twitchUser.displayName
  // });

  //

  //
  // connector.on('connect', async (data) => {
  //   winApp.webContents.send('clientStatus', { connected: true });
  //   clientConnected = true;
  //   riotCredentials = data;
  //   const url = `wss://${riotCredentials.username}:${riotCredentials.password}@127.0.0.1:${riotCredentials.port}`;
  //   const ws = new RiotWSProtocol(url);
  //   ws.on('open', () => {
  //     ws.subscribe('OnJsonApiEvent', (event: any) => {
  //       if (event?.data?.map?.gameMode === 'TFT') {
  //         if (event?.uri === '/lol-gameflow/v1/session') {
  //           console.log(event);
  //           if (event?.data?.phase === 'InProgress') {
  //             apiClient.chat.sendAnnouncement(twitchUser.id, twitchUser.id, { message: 'Game started' });
  //             apiClient.predictions.createPrediction(
  //               twitchUser.id,
  //               new (class implements HelixCreatePredictionData {
  //                 title = '¿Qué top quedamos?';
  //
  //                 outcomes = ['1,2', '3,4', '5,6', '7,8'];
  //
  //                 autoLockAfter = '120';
  //               })()
  //             );
  //             console.log('Game started');
  //           }
  //           if (event?.data.phase === 'EndOfGame') {
  //             apiClient.chat.sendAnnouncement(twitchUser.id, twitchUser.id, {
  //               message: 'Game ended'
  //             });
  //             console.log('Game ended');
  //             notifyEndOfGame();
  //           }
  //         }
  //       }
  //     });
  //   });
  //   await notifySummonerInfo();
  // });
  // connector.on('disconnect', () => {
  //   console.log('disconnected');
  //   winApp.webContents.send('clientStatus', { connected: false });
  //   clientConnected = false;
  // });
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

ipcMain.on('message', (event, message: any) => {
  // if (message === 'clientStatusCheck') {
  //   event.sender.send('clientStatus', { connected: clientConnected });
  //   winApp.webContents.send('twitchConnection', {
  //     twitchUserId: twitchUser.id,
  //     username: twitchUser.displayName
  //   });
  // }
});
ipcMain.on('message', async (event, message: any) => {
  // if (message === 'summonerInfoCheck') {
  //   await notifySummonerInfo();
  // }
});
ipcMain.on('message', async (event, message: any) => {
   if (message === 'tft-connect') {
     await tftAdapter.connect();
     const currentSummoner = await tftAdapter.getCurrentSummoner();
     console.log('currentSummoner: ', currentSummoner)
       winApp.webContents.send('tft-connected', currentSummoner);
   }
});

async function getEndOfGame() {
  const base64Creds = Buffer.from(`riot:${riotCredentials.password}`).toString('base64');
  const response = await fetch(`https://127.0.0.1:${riotCredentials.port}/lol-end-of-game/v1/tft-eog-stats`, {
    headers: { Authorization: `Basic ${base64Creds}` }
  });
  return response;
}

async function notifyEndOfGame() {
  // if (!clientConnected) return;
  // try {
  //   const response = await getEndOfGame();
  //   const endOfGame = await response.json();
  //   const { rank } = endOfGame.localPlayer;
  // } catch (e) {
  //   setTimeout(async () => {
  //     await notifyEndOfGame();
  //   }, 1000);
  // }
}
