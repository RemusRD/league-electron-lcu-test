import React, {useEffect, useState} from 'react';

function App() {
    const [riotClientInfo, setRiotClientInfo] = useState(false);
    const [twitchConnection, setTwitchConnection] = useState<{[key: string]: any}>({});

    useEffect(() => {
        if (window.Main) {
            window.Main.on('clientStatus', (message) => {
                setRiotClientInfo(message.connected);
            });
            window.Main.on('twitchConnection', (message) => {
                setTwitchConnection(message);
            });
        }
        window.Main.sendMessage('clientStatusCheck');
    }, [riotClientInfo]);

    return (
        <div className="flex flex-row">
            <div className="flex flex-col w-1/2">
                <div>
                    <p className="text-2xl">League client Status: {riotClientInfo ? 'Connected' : 'Disconnected'}</p>
                </div>
                <div>
                    <p className="text-2xl">Twitch connection : {twitchConnection?.username}</p>
                </div>
            </div>
        </div>);

}

export default App;
