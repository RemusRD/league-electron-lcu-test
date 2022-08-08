import React, { useEffect, useState } from 'react';
import AppBar from './AppBar';

function App() {
  const [clientStatus, setClientStatus] = useState(false);
  const [isSent, setSent] = useState(false);
  const [fromMain, setFromMain] = useState<string | null>(null);

  useEffect(() => {
    if (window.Main)
      window.Main.on('clientStatus', (message) => {
        setClientStatus(message.connected);
      });
    window.Main.sendMessage('clientStatusCheck');
  }, [clientStatus]);

  return (
    <div className="flex flex-col h-screen">
      {window.Main && (
        <div className="flex-none">
          <AppBar />
        </div>
      )}
      <div className="flex-auto">
        <div className=" flex flex-col justify-center items-center h-full bg-gray-800 space-y-4">
          <h2 className="text-white text-center"> {clientStatus === true ? 'Connected' : 'Disconnected'}</h2>
        </div>
      </div>
    </div>
  );
}

export default App;
