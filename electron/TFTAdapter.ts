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
      await onDisconnect();
    });
    this.connector.start();
  }

  // TODO: pass here the callbacks?
  async connect(onConnect: () => void) {
    return new Promise((resolve) => {
      const url = `wss://${this.riotCredentials.username}:${this.riotCredentials.password}@127.0.0.1:${this.riotCredentials.port}`;
      this.ws = new RiotWSProtocol(url);
      this.ws.on('open', async () => {
        const interval = setInterval(() => {
          if (this.clientConnected) {
            this.ws.on('open', async () => {
              try {
                this.ws.subscribe('nothing', () => {});
              } catch (e) {
                return;
              }
              try {
                const summoner = await this.getCurrentSummoner();
                if (!summoner.username) {
                  return;
                }
                console.log('TFT service available, username: ', summoner.username);
              } catch (e) {
                return;
              }
              this.ws.subscribe('OnJsonApiEvent_lol-gameflow_v1_gameflow-phase', (data) => {
                if (data.data === 'GameStart') {
                  // Limit to TFT
                  this.currentPrediction = this.twitchAdapter.createPrediction();
                }
              });
              this.ws.subscribe('OnJsonApiEvent_lol-end-of-game_v1_gameclient-eog-stats-block', async (data) => {
                if (!data?.data?.statsBlock?.players) return;
                console.log('game ended');
                await this.resolveCurrentPrediction(data);
                await this.twitchAdapter.launchAd();
              });
              clearInterval(interval);
              await onConnect();
              resolve(null);
            });
          }
        }, 1000);
      });
    });
  }

  private async resolveCurrentPrediction(data) {
    if (this.currentPrediction) {
      const summoner = await this.getCurrentSummoner();
      const summonerPosition = data?.data?.statsBlock?.players.find(
        (player: any) => player.summonerName === summoner.username
      ).ffaStanding;
      console.log('summonerPosition', summonerPosition);
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
