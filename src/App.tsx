import React, {useEffect, useState} from 'react';
import AppBar from "./AppBar";

function App() {
    const [riotClientInfo, setRiotClientInfo] = useState(false);
    const [twitchConnection, setTwitchConnection] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        if (window.Main) {
            window.Main.on('clientStatus', (message) => {
                setRiotClientInfo(message.connected);
            });
        }
    }, [riotClientInfo]);

    useEffect(() => {
        if (window.Main) {
            window.Main.on('twitchConnection', (message) => {
                setTwitchConnection(message);
            });
        }
    }, [twitchConnection]);
    useEffect(() => {
        window.Main.sendMessage('clientStatusCheck');
    }, []);

    const connectTft = () => {
        if (window.Main) {
            window.Main.sendMessage("tft-connect");
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-none">
                <AppBar/>
            </div>
            <div className=" flex flex-col justify-center items-center h-screen bg-gray-800 space-y-4">
                <h1 className="text-2xl text-gray-200">Vite + React + Typescript + Electron + Tailwind</h1>
                <div className="flex flex-col space-y-4 items-center">
                    <div className="flex space-x-3">
                        <h1 className="text-xl text-gray-50">League of legends conexión</h1>
                        <button onClick={connectTft}
                          className=" bg-green-400 rounded px-4 py-0 focus:outline-none hover:bg-green-300">
                            Conectar
                        </button>
                        {riotClientInfo && (
                          <div className="flex flex-col space-y-2">
                              <h1 className="text-gray-50 text-sm">Usuario: {riotClientInfo.username}</h1>
                          </div>
                        )}
                    </div>
                    <div>
                        <h4 className=" text-yellow-200"></h4>
                    </div>
                </div>
            </div>
            <div/>
        </div>
    );
}

export default App;
