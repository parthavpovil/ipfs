import React, { useState, useRef, useCallback, useEffect } from 'react';
import { connectWallet } from './utils/wallet';
import { ethers } from 'ethers';
import Webcam from 'react-webcam';
import { pinata } from './utils/config';
import { contractABI, contractAddress } from './utils/contract';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [reportHistory, setReportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal
  const webcamRef = useRef(null);

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
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

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsWebcamOn(false); // Stop the webcam after capture
    }
  }, [webcamRef]);

  const restartWebcam = () => {
    setCapturedImage(null);
    setIsWebcamOn(true); // Restart the webcam
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'photo.jpg');

      const uploadResponse = await pinata.post('/pinning/pinFileToIPFS', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = uploadResponse.data;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      setUploadUrl(ipfsUrl);
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
    }
  };

  const handleSubmitReport = async () => {
    if (!uploadUrl) return;
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.submitReport("Report Description", "Report Location", uploadUrl);
      await tx.wait();
      console.log("Report submitted successfully!");
      fetchReportHistory(); // Fetch history after submitting
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const fetchReportHistory = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const reports = await contract.getReportsByAddress(walletAddress);
      const formattedReports = reports.map(report => ({
        id: report.id.toNumber(),
        description: report.description,
        location: report.location,
        verified: report.verified,
        reward: report.reward.toString(),
        timestamp: report.timestamp.toNumber(),
      }));
      setReportHistory(formattedReports);
    } catch (error) {
      console.error('Error fetching report history:', error);
    }
  };

  const checkIfOwner = async (signer) => {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const ownerAddress = await contract.owner();
      const signerAddress = await signer.getAddress();
      setIsOwner(ownerAddress.toLowerCase() === signerAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking owner status:", error);
    }
  };

  // Function to handle modal open/close
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
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
            <div className="bg-white text-black rounded-lg p-4 mb-4 shadow-lg animate-slide-in">
              <h2 className="text-2xl font-semibold mb-2">Owner Interface</h2>
              <button className="bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg text-white transition-all duration-300 w-full">Verify Reports</button>
            </div>
          ) : (
            <div className="bg-white text-black rounded-lg p-4 shadow-lg animate-slide-in">
              <h2 className="text-2xl font-semibold mb-2 text-center">User Interface</h2>
              <button
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mb-4 w-full"
                onClick={() => setShowHistory(!showHistory)}
              >
                Toggle History
              </button>

              {showHistory && (
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-center">Your Report History</h3>
                  {reportHistory.length === 0 ? (
                    <p>No reports found.</p>
                  ) : (
                    reportHistory.map(report => (
                      <div key={report.id} className="border p-2 rounded-lg mb-2 shadow-md">
                        <p>ID: {report.id}</p>
                        <p>Description: {report.description}</p>
                        <p>Location: {report.location}</p>
                        <p>Verified: {report.verified ? 'Yes' : 'No'}</p>
                        <p>Reward: {report.reward}</p>
                        <p>Timestamp: {new Date(report.timestamp * 1000).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex flex-col items-center">
                {isWebcamOn && (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="mb-4 w-full rounded-lg shadow-md"
                    style={{ maxWidth: '100%' }}
                  />
                )}
                {capturedImage ? (
                  <>
                    <img src={capturedImage} alt="Captured" className="mb-4 w-full rounded-lg shadow-lg animate-fade-in" />
                    <button
                      className="bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mb-4 w-full"
                      onClick={handleUpload}
                    >
                      Upload to IPFS
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-all duration-300 w-full"
                      onClick={restartWebcam}
                    >
                      Capture Again
                    </button>
                    {uploadUrl && (
                      <>
                        <button
                          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mt-4 w-full"
                          onClick={handleSubmitReport}
                        >
                          Submit Report
                        </button>

                        {/* Button to trigger modal */}
                        <button
                          className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mt-4 w-full"
                          onClick={toggleModal}
                        >
                          View IPFS URL
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white transition-all duration-300 mb-4 w-full"
                    onClick={capture}
                  >
                    Capture Photo
                  </button>
                )}

                {/* Modal for displaying the IPFS URL */}
                {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4">IPFS URL</h2>
      <p className="break-all mb-4">
        <a
          href={uploadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {uploadUrl}
        </a>
      </p>
      <button
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-all duration-300 w-full"
        onClick={toggleModal}
      >
        Close
      </button>
    </div>
  </div>
)}

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
