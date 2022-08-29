// @ts-nocheck
import LCUConnector from "lcu-connector";
import fetch from 'electron-fetch';

export default class TftAdapter {

  connector = new LCUConnector();

  riotCredentials: any;

  clientConnected = false;

  constructor() {
    this.connector.on('connect',  (data) => {
      this.riotCredentials = data;
      this.clientConnected = true;
    });
    this.connector.on('disconnect', () => {
      this.riotCredentials = null;
      this.clientConnected = false;
    });
    this.connector.start();
  }

  async connect() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.clientConnected) {
          clearInterval(interval);
          console.log('Tft connected successfully')
          resolve(null);
        }
      } , 100);
    })
  }

  async getCurrentSummoner() : Promise<Summoner> {
    const base64Creds = Buffer.from(`riot:${this.riotCredentials.password}`).toString('base64');
    const response = await fetch(`https://127.0.0.1:${this.riotCredentials.port}/lol-summoner/v1/current-summoner`, {
      headers: {Authorization: `Basic ${base64Creds}`}
    });
    return new Summoner((await response.json()).displayName);
  }



  async notifySummonerInfo() {
    // if (!clientConnected) return;
    // try {
    //   const response = await getCurrentSummoner();
    //   const summonerInfo = await response.json();
    //   if (response.status === 200 && summonerInfo.displayName) {
    //     // winApp.webContents.send('summonerInfo', {
    //     //   id: summonerInfo.accountId,
    //     //   name: summonerInfo.displayName,
    //     //   level: summonerInfo.summonerLevel
    //     // }); // todo internal event? return?
    //   } else {
    //     setTimeout(async () => {
    //       await notifySummonerInfo();
    //     }, 1000);
    //   }
    // } catch (e) {
    //   setTimeout(async () => {
    //     await notifySummonerInfo();
    //   }, 1000);
    // }
  }

}

class Summoner {
  constructor(readonly username: String) {}
}
