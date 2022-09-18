// @ts-nocheck
import LCUConnector from 'lcu-connector';
import fetch from 'electron-fetch';
import { RiotWSProtocol } from './RiotWSProtocol';
import TwitchAdapter, { Prediction } from './TwitchAdapter';

export default class TftAdapter {
  connector = new LCUConnector();

  riotCredentials: any;

  ws: RiotWSProtocol;

  clientConnected = false;

  currentPrediction: Prediction | null;

  twitchAdapter: TwitchAdapter;

  constructor(twitchAdapter: TwitchAdapter, onConnect: () => void, onDisconnect: () => void) {
    this.connector.on('connect', async (data) => {
      this.riotCredentials = data;
      this.clientConnected = true;
      this.twitchAdapter = twitchAdapter;
      await this.connect(onConnect);
    });
    this.connector.on('disconnect', async () => {
      this.riotCredentials = null;
      this.clientConnected = false;
      this.ws.close();
      this.ws = null;
      await onDisconnect();
      console.log('disconnected from client');
    });
    this.connector.start();
  }

  // TODO: pass here the callbacks?
  async connect(onConnect: () => void) {
    if (this.clientConnected) {
      const url = `wss://${this.riotCredentials.username}:${this.riotCredentials.password}@127.0.0.1:${this.riotCredentials.port}`;
      console.log('instantiating RiotWSProtocol with url: ', url);
      this.ws = new RiotWSProtocol(url);
      console.log('connecting to riot ws');
      // wait until ws is ready
      await new Promise((resolve) => {
        console.log('waiting for ws to be ready');
        console.log('ws ready?', this.ws.readyState);
        const interval = setInterval(async () => {
          if (this.ws.readyState > 1) {
            this.ws = new RiotWSProtocol(url);
          }
          console.log("polling ws's readyState", this.ws.readyState);
          if (this.ws.readyState === 1) {
            console.log('connected to client successfully');
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
      await new Promise((resolve) => {
        console.log('waiting for summoner');
        const interval = setInterval(async () => {
          const summoner = await this.getCurrentSummoner();
          if (summoner.username) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
      this.ws.subscribe('OnJsonApiEvent_lol-gameflow_v1_gameflow-phase', (data) => {
        if (data.data === 'GameStart') {
          // Limit to TFT
          this.currentPrediction = this.twitchAdapter.createPrediction();
        }
      });
      this.ws.subscribe('OnJsonApiEvent_lol-end-of-game_v1_gameclient-eog-stats-block', async (data) => {
        if (!data?.data?.statsBlock?.players) return;
        console.log('game ended, current prediction', JSON.stringify(this.currentPrediction));
        await this.resolveCurrentPrediction(data);
        await this.twitchAdapter.launchAd();
      });
      await onConnect();
    }
  }

  private async resolveCurrentPrediction(data) {
    if (this.currentPrediction) {
      const summoner = await this.getCurrentSummoner();
      const summonerPosition = data?.data?.statsBlock?.players.find(
        (player: any) => player.summonerName === summoner.username
      ).ffaStanding;
      console.log('summonerPosition', summonerPosition);
      console.log('Possible outcomes: ', JSON.stringify(this.currentPrediction.outcomes));
      const outcome = this.currentPrediction?.outcomes?.find((outcome: any) =>
        outcome.title.includes(summonerPosition)
      );
      await this.twitchAdapter.endPrediction(this.currentPrediction.id, outcome);
      this.currentPrediction = null;
    }
  }

  async getCurrentSummoner(): Promise<Summoner> {
    const base64Creds = Buffer.from(`riot:${this.riotCredentials.password}`).toString('base64');
    const response = await fetch(`https://127.0.0.1:${this.riotCredentials.port}/lol-summoner/v1/current-summoner`, {
      headers: { Authorization: `Basic ${base64Creds}` }
    });
    return new Summoner((await response.json()).displayName);
  }
}

class Summoner {
  constructor(readonly username: string) {}
}
