import React, { useState } from 'react';
import WebcamCapture from './WebcamCapture';

function UserInterface({ walletAddress, signer }) {
  const [showHistory, setShowHistory] = useState(false);

  const toggleHistory = () => setShowHistory(!showHistory);

  return (
    <div className="bg-white text-black rounded-lg p-4 shadow-lg animate-slide-in">
      <h2 className="text-2xl font-semibold mb-2 text-center">User Interface</h2>
      <button
        className=" bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mb-4 w-full"
        onClick={toggleHistory}
      >
        Toggle History
      </button>
      {showHistory && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Your Report History</h3>
          {/* Implement history display */}
        </div>
      )}
      <WebcamCapture walletAddress={walletAddress} signer={signer} />
    </div>
  );
}

export default UserInterface;
