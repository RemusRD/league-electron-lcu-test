// @ts-nocheck
import { join } from 'path';
import LCUConnector from 'lcu-connector';
import fetch from 'electron-fetch';

// Packages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as electron from 'electron';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import { ElectronAuthProvider } from '@twurple/auth-electron';
import { AccessToken, StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { RiotWSProtocol } from './RiotWSProtocol';
import { clientId } from './config';

electron.app.commandLine.appendSwitch('ignore-certificate-errors');

const height = 400;
const width = 600;
let clientConnected = false;
let riotCredentials: any = null;
let winApp: any = null;
let twitchCredentials: AccessToken = null;

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

async function getCurrentSummoner() {
  const base64Creds = Buffer.from(`riot:${riotCredentials.password}`).toString('base64');
  const response = await fetch(`https://127.0.0.1:${riotCredentials.port}/lol-summoner/v1/current-summoner`, {
    headers: { Authorization: `Basic ${base64Creds}` }
  });
  return response;
}

async function notifySummonerInfo() {
  if (!clientConnected) return;
  try {
    // twitchCredentials = await authProvider.getAccessToken(['chat:read', 'chat:edit']);
    // console.log('twitchCredentials: ', twitchCredentials);
    const response = await getCurrentSummoner();
    const summonerInfo = await response.json();
    if (response.status === 200 && summonerInfo.displayName) {
      winApp.webContents.send('summonerInfo', {
        id: summonerInfo.accountId,
        name: summonerInfo.displayName,
        level: summonerInfo.summonerLevel
      });
    } else {
      setTimeout(async () => {
        await notifySummonerInfo();
      }, 1000);
    }
  } catch (e) {
    setTimeout(async () => {
      await notifySummonerInfo();
    }, 1000);
  }
}

// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  winApp = createWindow();
  twitchCredentials = await authProvider.getAccessToken(['chat:edit', 'chat:read']);
  const provider = new StaticAuthProvider(clientId, twitchCredentials.accessToken);
  const chatClient = new ChatClient({
    authProvider,
    channels: ['remusrichard']
  });
  await chatClient.connect();
  chatClient.onRegister(() => {
    chatClient.say('remusrichard', 'Hello, I\'m now connected!');
    console.log(authProvider.currentScopes);
    console.log('chatClient.onRegister');
  })
  const connector = new LCUConnector();
  connector.on('connect', async (data) => {
    winApp.webContents.send('clientStatus', { connected: true });
    clientConnected = true;
    riotCredentials = data;
    const url = `wss://${riotCredentials.username}:${riotCredentials.password}@127.0.0.1:${riotCredentials.port}`;
    const ws = new RiotWSProtocol(url);
    console.log(riotCredentials);
    ws.on('open', () => {
      console.log('connected');
      ws.subscribe('OnJsonApiEvent', (event: any) => {
        if (event?.data?.map?.gameMode === 'TFT') {
          if (event?.uri !== '/lol-gameflow/v1/session') {
            if (event?.data?.phase === 'InProgress') {
              console.log(`Started game with Id: ${event?.data?.gameData?.gameId}`);
              console.log(`properties: ${event?.data?.map?.properties}`);
            }
            if (event?.data.phase === 'EndOfGame') {
              console.log(`Ended game with Id: ${event?.data?.gameData?.gameId}`);
              notifyEndOfGame();
            }
          }
        }
      });
    });
    await notifySummonerInfo();
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
ipcMain.on('message', async (event, message: any) => {
  if (message === 'summonerInfoCheck') {
    await notifySummonerInfo();
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
  if (!clientConnected) return;
  try {
    const response = await getEndOfGame();
    const endOfGame = await response.json();
    const { rank } = endOfGame.localPlayer;
    console.log('rank: ', rank);
  } catch (e) {
    setTimeout(async () => {
      await notifyEndOfGame();
    }, 1000);
  }
}
