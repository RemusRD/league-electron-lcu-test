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

  constructor() {
    this.connector.on('connect', (data) => {
      this.riotCredentials = data;
      this.clientConnected = true;
    });
    this.connector.on('disconnect', () => {
      this.riotCredentials = null;
      this.clientConnected = false;
    });
    this.connector.start();
  }

  // TODO: pass here the callbacks
  async connect(twitchAdapter: TwitchAdapter) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.clientConnected) {
          clearInterval(interval);
          const url = `wss://${this.riotCredentials.username}:${this.riotCredentials.password}@127.0.0.1:${this.riotCredentials.port}`;
          this.ws = new RiotWSProtocol(url);
          this.ws.on('open', () => {
            this.ws.subscribe('OnJsonApiEvent_lol-gameflow_v1_gameflow-phase', (data) => {
              if (data.data === 'GameStart') {
                this.onGameStarted();
                this.currentPrediction = twitchAdapter.createPrediction();
              }
            });
            this.ws.subscribe('OnJsonApiEvent_lol-end-of-game_v1_gameclient-eog-stats-block', async (data) => {
              if (!data?.data?.statsBlock?.players) return;
              console.log('game ended');
              console.log(data);
              console.log(data?.data?.statsBlock);
              console.log(data?.data?.statsBlock?.players);
              if (this.currentPrediction) {
                const summoner = await this.getCurrentSummoner();
                const summonerPosition = data?.data?.statsBlock?.players.find(
                  (player: any) => player.summonerName === summoner.username
                ).ffaStanding;
                const outcome = this.currentPrediction?.outcomes?.find((outcome: any) =>
                  outcome.title.includes(summonerPosition)
                );
                await twitchAdapter.endPrediction(this.currentPrediction.id, outcome);
                this.currentPrediction = null;
              }
              this.onGameEnded();
            });
            resolve(null);
          });
        }
      }, 100);
    });
  }

  async getCurrentSummoner(): Promise<Summoner> {
    const base64Creds = Buffer.from(`riot:${this.riotCredentials.password}`).toString('base64');
    const response = await fetch(`https://127.0.0.1:${this.riotCredentials.port}/lol-summoner/v1/current-summoner`, {
      headers: { Authorization: `Basic ${base64Creds}` }
    });
    return new Summoner((await response.json()).displayName);
  }

  onGameStarted(callback: Function) {
    console.log('game started');
  }

  onGameEnded(callback: Function) {
    console.log('game ended');
  }
}

class Summoner {
  constructor(readonly username: string) {}
}
