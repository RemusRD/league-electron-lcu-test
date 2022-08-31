// @ts-nocheck
import LCUConnector from "lcu-connector";
import fetch from 'electron-fetch';
import {RiotWSProtocol} from "./RiotWSProtocol";
import TwitchAdapter, {Prediction} from "./TwitchAdapter";

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
                                this.currentPrediction = twitchAdapter.createPrediction()
                            }
                        });
                        this.ws.subscribe('OnJsonApiEvent_lol-end-of-game_v1_gameclient-eog-stats-block', async (data) => {
                            if (!data?.data?.statsBlock?.players) return;
                            console.log("game ended");
                            console.log(data);
                            console.log(data?.data?.statsBlock);
                            console.log(data?.data?.statsBlock?.players);
                            if (this.currentPrediction) {
                                const summoner = await this.getCurrentSummoner()
                                const summonerPosition = data?.data?.statsBlock?.players
                                    .find((player: any) => player.summonerName === summoner.name).ffaStanding;
                                const outcome = this.currentPrediction?.outcomes?.find((outcome: any) => outcome.title.includes(summonerPosition));
                                twitchAdapter.endPrediction(this.currentPrediction.id, outcome);
                                this.currentPrediction = null;
                            }
                            //example:
                            //1] {
                            // [1]   gameLengthSeconds: 631,
                            // [1]   players: [
                            // [1]     {
                            // [1]       PUUID: '4b41b6e7-46ae-5934-9c13-31147d63869b',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '303dd030-1066-48ec-ab09-c711e17bd1a0',
                            // [1]       companionName: 'PetBallDragon',
                            // [1]       companionSkinId: 13,
                            // [1]       ffaStanding: 6,
                            // [1]       health: 80,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 2926649595921536,
                            // [1]       summonerIconID: 5271,
                            // [1]       summonerName: 'zHubbleBubble'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: '18b8d03b-5ba2-5363-bcb8-c0351961086b',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '4b19b861-a128-484b-b993-fa023e150da7',
                            // [1]       companionName: 'PetDSSwordGuy',
                            // [1]       companionSkinId: 21,
                            // [1]       ffaStanding: 8,
                            // [1]       health: 0,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 29069505,
                            // [1]       summonerIconID: 508,
                            // [1]       summonerName: 'Kotlin Lover'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: '38836737-cf6a-57ec-b2b9-311833dad74b',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '39ca897d-34dc-4f97-adb8-514a8faf8733',
                            // [1]       companionName: 'PetBallDragon',
                            // [1]       companionSkinId: 8,
                            // [1]       ffaStanding: 3,
                            // [1]       health: 88,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 150482443,
                            // [1]       summonerIconID: 23,
                            // [1]       summonerName: 'pedrofiti11'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: '7c73f6ae-45db-5b65-a4f3-d8a71c52d91d',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '39ca897d-34dc-4f97-adb8-514a8faf8733',
                            // [1]       companionName: 'PetBallDragon',
                            // [1]       companionSkinId: 8,
                            // [1]       ffaStanding: 4,
                            // [1]       health: 86,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 2642646702679072,
                            // [1]       summonerIconID: 5491,
                            // [1]       summonerName: 'HenriqueKING'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: 'a30fc58f-abd9-510f-80a8-97ee91a4ffeb',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '303dd030-1066-48ec-ab09-c711e17bd1a0',
                            // [1]       companionName: 'PetBallDragon',
                            // [1]       companionSkinId: 13,
                            // [1]       ffaStanding: 5,
                            // [1]       health: 84,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 2600329256601376,
                            // [1]       summonerIconID: 4793,
                            // [1]       summonerName: 'biia25'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: 'd8e8f682-cfe0-50c7-b7e4-a9e3d010affd',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '52fb7d7d-00ac-4464-ba08-93dbe67ddba9',
                            // [1]       companionName: 'PetJawDragon',
                            // [1]       companionSkinId: 13,
                            // [1]       ffaStanding: 1,
                            // [1]       health: 96,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 240262643,
                            // [1]       summonerIconID: 5316,
                            // [1]       summonerName: 'Silvaplays1234'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: '71dd557f-0e2c-5e13-a68b-74bdf448c157',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: '5cba1b97-1148-4c8c-a12b-8e42e5e50997',
                            // [1]       companionName: 'PetAkaliDragon',
                            // [1]       companionSkinId: 16,
                            // [1]       ffaStanding: 7,
                            // [1]       health: 66,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 32529581,
                            // [1]       summonerIconID: 5460,
                            // [1]       summonerName: 'Mon sac est fèh'
                            // [1]     },
                            // [1]     {
                            // [1]       PUUID: '0c911738-624f-5ade-abeb-61f50eed5453',
                            // [1]       augments: [Array],
                            // [1]       boardPieces: [Array],
                            // [1]       companionContentId: 'd401983f-04c9-4809-a1f4-d995a9ab6091',
                            // [1]       companionName: 'PetFenroar',
                            // [1]       companionSkinId: 18,
                            // [1]       ffaStanding: 2,
                            // [1]       health: 92,
                            // [1]       partnerGroupId: 0,
                            // [1]       playerId: 20508983,
                            // [1]       summonerIconID: 3614,
                            // [1]       summonerName: 'Lupogryph'
                            // [1]     }
                            // [1]   ]
                            // [1] }
                            // [1] [
                            // [1]   {
                            // [1]     PUUID: '4b41b6e7-46ae-5934-9c13-31147d63869b',
                            // [1]     augments: [ 'TFT7_Augment_ShimmerscaleTrait', 'TFT6_Augment_PortableForge' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '303dd030-1066-48ec-ab09-c711e17bd1a0',
                            // [1]     companionName: 'PetBallDragon',
                            // [1]     companionSkinId: 13,
                            // [1]     ffaStanding: 6,
                            // [1]     health: 80,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 2926649595921536,
                            // [1]     summonerIconID: 5271,
                            // [1]     summonerName: 'zHubbleBubble'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: '18b8d03b-5ba2-5363-bcb8-c0351961086b',
                            // [1]     augments: [ 'TFT7_Augment_ClutteredMind', 'TFT6_Augment_Meditation2' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '4b19b861-a128-484b-b993-fa023e150da7',
                            // [1]     companionName: 'PetDSSwordGuy',
                            // [1]     companionSkinId: 21,
                            // [1]     ffaStanding: 8,
                            // [1]     health: 0,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 29069505,
                            // [1]     summonerIconID: 508,
                            // [1]     summonerName: 'Kotlin Lover'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: '38836737-cf6a-57ec-b2b9-311833dad74b',
                            // [1]     augments: [ 'TFT6_Augment_TomeOfTraits1' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '39ca897d-34dc-4f97-adb8-514a8faf8733',
                            // [1]     companionName: 'PetBallDragon',
                            // [1]     companionSkinId: 8,
                            // [1]     ffaStanding: 3,
                            // [1]     health: 88,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 150482443,
                            // [1]     summonerIconID: 23,
                            // [1]     summonerName: 'pedrofiti11'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: '7c73f6ae-45db-5b65-a4f3-d8a71c52d91d',
                            // [1]     augments: [ 'TFT6_Augment_BlueBattery2' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '39ca897d-34dc-4f97-adb8-514a8faf8733',
                            // [1]     companionName: 'PetBallDragon',
                            // [1]     companionSkinId: 8,
                            // [1]     ffaStanding: 4,
                            // [1]     health: 86,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 2642646702679072,
                            // [1]     summonerIconID: 5491,
                            // [1]     summonerName: 'HenriqueKING'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: 'a30fc58f-abd9-510f-80a8-97ee91a4ffeb',
                            // [1]     augments: [ 'TFT6_Augment_SecondWind2' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '303dd030-1066-48ec-ab09-c711e17bd1a0',
                            // [1]     companionName: 'PetBallDragon',
                            // [1]     companionSkinId: 13,
                            // [1]     ffaStanding: 5,
                            // [1]     health: 84,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 2600329256601376,
                            // [1]     summonerIconID: 4793,
                            // [1]     summonerName: 'biia25'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: 'd8e8f682-cfe0-50c7-b7e4-a9e3d010affd',
                            // [1]     augments: [ 'TFT6_Augment_BlueBattery2' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '52fb7d7d-00ac-4464-ba08-93dbe67ddba9',
                            // [1]     companionName: 'PetJawDragon',
                            // [1]     companionSkinId: 13,
                            // [1]     ffaStanding: 1,
                            // [1]     health: 96,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 240262643,
                            // [1]     summonerIconID: 5316,
                            // [1]     summonerName: 'Silvaplays1234'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: '71dd557f-0e2c-5e13-a68b-74bdf448c157',
                            // [1]     augments: [ 'TFT7_Augment_PandorasBench' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: '5cba1b97-1148-4c8c-a12b-8e42e5e50997',
                            // [1]     companionName: 'PetAkaliDragon',
                            // [1]     companionSkinId: 16,
                            // [1]     ffaStanding: 7,
                            // [1]     health: 66,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 32529581,
                            // [1]     summonerIconID: 5460,
                            // [1]     summonerName: 'Mon sac est fèh'
                            // [1]   },
                            // [1]   {
                            // [1]     PUUID: '0c911738-624f-5ade-abeb-61f50eed5453',
                            // [1]     augments: [ 'TFT6_Augment_TradeSector' ],
                            // [1]     boardPieces: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
                            // [1]     companionContentId: 'd401983f-04c9-4809-a1f4-d995a9ab6091',
                            // [1]     companionName: 'PetFenroar',
                            // [1]     companionSkinId: 18,
                            // [1]     ffaStanding: 2,
                            // [1]     health: 92,
                            // [1]     partnerGroupId: 0,
                            // [1]     playerId: 20508983,
                            // [1]     summonerIconID: 3614,
                            // [1]     summonerName: 'Lupogryph'
                            // [1]   }
                            // [1] ]
                            this.onGameEnded();
                        });
                        resolve(null);
                    });
                }
            }, 100);
        })
    }

    async getCurrentSummoner(): Promise<Summoner> {
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

    onGameStarted(callback: Function) {
        console.log("game started");
    }

    onGameEnded(callback: Function) {
        console.log("game ended");
    }
}

class Summoner {
    constructor(readonly username: String) {
    }
}
