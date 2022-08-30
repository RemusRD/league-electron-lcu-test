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

  async connect(): TwitchUser {
    const twitchCredentials = await this.authProvider.getAccessToken([
      'chat:edit',
      'chat:read',
      'user:read:email',
      'channel:manage:predictions'
    ]);
    const apiClient = new ApiClient({authProvider: this.authProvider});
    const twitchUser = await apiClient.helix.users.getMe()
    const chatClient = new ChatClient(this.authProvider, {channels: [twitchUser.displayName]})
    await chatClient.say('#' + twitchUser.displayName, 'hello from app')
    await chatClient.send('hello from app with send')
    return new TwitchUser(twitchUser.displayName);
  }
}

class TwitchUser {
  constructor(readonly username: String) {
  }
}