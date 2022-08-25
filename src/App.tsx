import React, {useEffect, useState} from 'react';

function App() {
    const [riotClientInfo, setRiotClientInfo] = useState(false);
    const [twitchClientInfo, setTwitchClientInfo] = useState(false);

    useEffect(() => {
        if (window.Main)
            window.Main.on('clientStatus', (message) => {
                setRiotClientInfo(message.connected);
            });
        window.Main.sendMessage('clientStatusCheck');
    }, [riotClientInfo]);

  // split the screen in 2 blocks side by side, left side is the connection status and the broadcasterName,
  // right side is the league client status and the summonerName using tailwind

}

export default App;
