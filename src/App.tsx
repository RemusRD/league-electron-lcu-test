import React, {useEffect, useState} from 'react';
import TftIcon from './assets/icons/tft-icon.webp';
import TwitchIcon from './assets/icons/twitch-icon.png';


function App() {
    const [riotClientInfo, setRiotClientInfo] = useState(null);
    const [twitchConnection, setTwitchConnection] = useState(null);
    const [PredictionsEnabled, setPredictionsEnabled] = useState(false);

    useEffect(() => {
        if (window.Main) {
            window.Main.on('tft-connected', (message) => {
                setRiotClientInfo(message);
            });
        }
    }, []);
    useEffect(() => {
        if (window.Main) {
            window.Main.on('twitch-connected', (message) => {
                    setTwitchConnection(message);
                }
            );
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

    const connectTwitch = () => {
        if (window.Main) {
            window.Main.sendMessage("twitch-connect");
        }
    };
    const enablePredictions = () => {
        if (window.Main) {
            window.Main.sendMessage("enable-predictions");
            setPredictionsEnabled(true);
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <div className=" flex flex-col justify-center items-center h-screen bg-gray-800 space-y-4">
                <h1 className="text-2xl text-gray-200">TFT prediction companion</h1>
                <div className="flex flex-col space-y-4 items-center">
                    <div className="flex space-x-3">
                        <img className="h-6 lg:-ml-2" src={TftIcon} alt="Tft icon"/>
                        <h1 className="text-xl text-gray-50">League of legends(requiere cliente iniciado): </h1>
                        {!riotClientInfo && (
                            <button onClick={connectTft}
                                    className=" bg-amber-500 rounded px-4 py-0 focus:outline-none hover:bg-amber-300">
                                Conectar
                            </button>)}
                        {riotClientInfo && (
                            <h1 className="text-xl text-gray-50">{riotClientInfo.username} </h1>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <img className="h-6 lg:-ml-2" src={TwitchIcon} alt="Tft icon"/>
                        <h1 className="text-xl text-gray-50">Conexión Twitch: </h1>
                        {!twitchConnection && (
                            <button onClick={connectTwitch}
                                    className="bg-purple-500 rounded px-4 py-0 focus:outline-none hover:bg-purple-300">
                                Conectar
                            </button>)}
                        {twitchConnection && (
                            <h1 className="text-xl text-gray-50">{twitchConnection.username} </h1>
                        )}
                    </div>
                    {riotClientInfo && twitchConnection && (
                            <div className="flex items-center space-x-3">
                                <input type="checkbox" className="form-checkbox h-5 w-5 text-gray-600"
                                       checked={PredictionsEnabled}
                                       disabled={PredictionsEnabled}
                                       onChange={enablePredictions}/>
                                <label htmlFor="activate"><h1 className="text-l text-gray-50">Predicciones
                                    automáticas </h1></label>
                            </div>)}
                </div>
            </div>
            <div className="flex justify-end items-end h-10 w-full bg-gray-800 text-gray-500 px-6">
                <p className="text-s">© 2022 Remusrd</p>
            </div>
            <div/>
        </div>
    );
}

export default App;
