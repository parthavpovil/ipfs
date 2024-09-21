import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import OwnerInterface from './components/OwnerInterface';
import UserInterface from './components/UserInterface';
import { connectWallet } from './utils/wallet';
import { contractABI, contractAddress } from './utils/contract';

function AppContent() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      if (isMobile()) {
        if (typeof window.ethereum === 'undefined') {
          window.location.href = 'https://metamask.app.link/dapp/https://kichuman28.github.io/ipfs/';
          return;
        }
      }

      if (typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined') {
        const provider = window.ethereum || window.web3.currentProvider;
        const { signer: walletSigner, provider: walletProvider } = await connectWallet();
        const walletAddress = await walletSigner.getAddress();
        setSigner(walletSigner);
        setProvider(walletProvider);
        setWalletConnected(true);
        setWalletAddress(walletAddress);
        await checkIfOwner(walletSigner);
      } else {
        alert('Please install MetaMask or use the MetaMask mobile app!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = () => {
    const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
    return toMatch.some((toMatchItem) => navigator.userAgent.match(toMatchItem));
  };

  const checkIfOwner = async (signer) => {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const ownerAddress = await contract.owner();
      const signerAddress = await signer.getAddress();
      setIsOwner(ownerAddress.toLowerCase() === signerAddress.toLowerCase());
    } catch (error) {
      console.error('Error checking owner status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-8 animate-fade-in text-center">Traffix</h1>

      {!walletConnected ? (
        <button
          className={`bg-teal-500 hover:bg-teal-600 px-6 py-2 rounded-lg text-white transition-all duration-300 ${loading ? 'animate-pulse' : ''}`}
          onClick={handleConnectWallet}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="w-full max-w-lg">
          <p className="text-lg mb-4 text-center">Connected to wallet: {walletAddress}</p>
          {isOwner ? (
            <OwnerInterface />
          ) : (
            <UserInterface walletAddress={walletAddress} signer={signer} />
          )}
        </div>
      )}
    </div>
  );
}

export default AppContent;
