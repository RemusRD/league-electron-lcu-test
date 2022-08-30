// @ts-nocheck

import {clientId} from './config';
import {ElectronAuthProvider} from "@twurple/auth-electron";
import {ApiClient} from "twitch";
import {ChatClient} from "twitch-chat-client";

export default class TwitchAdapter {

    authProvider = new ElectronAuthProvider({
        clientId,
        redirectUri: 'http://localhost:3000/auth/callback'
    });

    chatClient: ChatClient;

    twitchUser: TwitchUser;

    async connect(): TwitchUser {
        const twitchCredentials = await this.authProvider.getAccessToken([
            'chat:edit',
            'chat:read',
            'user:read:email',
            'channel:manage:predictions'
        ]);
        const apiClient = new ApiClient({authProvider: this.authProvider});
        const twitchUser = await apiClient.helix.users.getMe()
        this.chatClient = new ChatClient(this.authProvider, {channels: [twitchUser.displayName]})
        await this.chatClient.connect();
        this.twitchUser = new TwitchUser(twitchUser.displayName)
        return this.twitchUser;
    }

    async helloChat(message: string) {
        await this.chatClient.say(this.twitchUser.username, message);
    }
}


class TwitchUser {
    constructor(readonly username: String) {
    }
}