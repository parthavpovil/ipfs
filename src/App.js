import React, { useState, useRef, useCallback, useEffect } from 'react';
import { connectWallet } from './utils/wallet';
import { ethers } from 'ethers';
import Webcam from 'react-webcam';
import { pinata } from './utils/config'; 
import { contractABI, contractAddress } from './utils/contract'; 
import './App.css';

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
  const webcamRef = useRef(null);

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const { signer: walletSigner, provider: walletProvider } = await connectWallet();
      const walletAddress = await walletSigner.getAddress();
      setSigner(walletSigner);
      setProvider(walletProvider);
      setWalletConnected(true);
      setWalletAddress(walletAddress);
      await checkIfOwner(walletSigner);
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
    }
  }, [webcamRef]);

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

  return (
    <div className="app-container">
      <h1>Traffix</h1>
      {!walletConnected ? (
        <button className="connect-wallet-button" onClick={handleConnectWallet} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <>
          <p>Connected to wallet: {walletAddress}</p>
          {isOwner ? (
            <div className="owner-interface">
              <h2>Owner Interface</h2>
              <button className="verify-reports-button">Verify Reports</button>
            </div>
          ) : (
            <div className="user-interface">
              <h2>User Interface</h2>
              <button onClick={() => setShowHistory(!showHistory)}>Toggle History</button>
              {showHistory && (
                <div className="history-section">
                  <h3>Your Report History</h3>
                  {reportHistory.length === 0 ? (
                    <p>No reports found.</p>
                  ) : (
                    reportHistory.map(report => (
                      <div key={report.id}>
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
              <div className="webcam-section">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="300px" // Set a specific width for the webcam
                />
                <button className="capture-button" onClick={capture}>Capture Photo</button>
              </div>
              {capturedImage && (
                <div className="captured-image-section">
                  <h3>Captured Image</h3>
                  <img src={capturedImage} alt="Captured" width="50%" />
                  <button className="upload-button" onClick={handleUpload}>Upload to IPFS</button>
                  {uploadUrl && (
                    <button onClick={handleSubmitReport}>Submit Report</button>
                  )}
                </div>
              )}
              {uploadUrl && (
                <div className="uploaded-image-section">
                  <h3>Uploaded Image</h3>
                  <a href={uploadUrl} target="_blank" rel="noopener noreferrer">{uploadUrl}</a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
