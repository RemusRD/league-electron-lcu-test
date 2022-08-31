// @ts-nocheck

import {ElectronAuthProvider} from '@twurple/auth-electron';
import {ApiClient, HelixCreatePredictionData} from 'twitch';
import {ChatClient} from 'twitch-chat-client';
import {clientId} from './config';

export default class TwitchAdapter {
    authProvider = new ElectronAuthProvider({
        clientId,
        redirectUri: 'http://localhost:3000/auth/callback'
    });

    chatClient: ChatClient;

    twitchUser: TwitchUser;

    apiClient: ApiClient;

    async connect(): TwitchUser {
        const twitchCredentials = await this.authProvider.getAccessToken([
            'chat:edit',
            'chat:read',
            'user:read:email',
            'channel:manage:predictions'
        ]);
        this.apiClient = new ApiClient({authProvider: this.authProvider});
        const twitchUser = await this.apiClient.helix.users.getMe();
        this.chatClient = new ChatClient(this.authProvider, {channels: [twitchUser.displayName]});
        await this.chatClient.connect();
        this.twitchUser = new TwitchUser(twitchUser.id, twitchUser.displayName);
        return this.twitchUser;
    }

    async createPrediction() : Prediction {
        const prediction = await this.apiClient.helix.predictions.createPrediction(
            this.twitchUser.id,
            new class implements HelixCreatePredictionData {
                title = '¿Qué top quedamos?';

                outcomes = ['1,2', '3,4', '5,6', '7,8'];

                autoLockAfter = '120';
            }());

        console.log(`Twitch created prediction`)
        return new Prediction(
            prediction.outcomes.map(
                outcome => new PredictionOutcome(outcome.id, outcome.title)
            )
        );
    }

    async endPrediction(predictionId: string, outcome: PredictionOutcome) {
        console.log(`Twitch end prediction with outcome ${outcome}`)
        await this.apiClient.helix.predictions.resolvePrediction(this.twitchUser.id, predictionId, outcome.id);
    }

    async helloChat(message: string) {
        await this.chatClient.say(this.twitchUser.username, message);
    }
}

export class TwitchUser {
    constructor(readonly id: string, readonly username: string) {
    }
}

export class Prediction {
    constructor(readonly outcomes: PredictionOutcome[]) {
    }
}

export class PredictionOutcome {
    constructor(readonly id: string, readonly title: string) {
    }
}
