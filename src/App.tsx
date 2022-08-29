import React, {useEffect, useState} from 'react';
import AppBar from "./AppBar";
import Icon from './assets/icons/tft-icon.webp';


function App() {
    const [riotClientInfo, setRiotClientInfo] = useState(null);
    const [twitchConnection, setTwitchConnection] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        if (window.Main) {
            window.Main.on('tft-connected', (message) => {
                setRiotClientInfo(message);
            });
        }
    }, []);


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
                <h1 className="text-2xl text-gray-200">TFT prediction maker</h1>
                <div className="flex flex-col space-y-4 items-center">
                    <div className="flex space-x-3">
                        <img className="h-6 lg:-ml-2" src={Icon} alt="Tft icon" />
                        <h1 className="text-xl text-gray-50">Conexión League of legends</h1>
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
