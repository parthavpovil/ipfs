import React, { useState, useRef } from 'react';
import { connectWallet } from './utils/wallet';
import { pinata, pinataGateway, pinataJwt } from './utils/config';
import Webcam from 'react-webcam';
import { ethers } from 'ethers'; // ethers.js for Ethereum interaction
import './App.css'; // Import the CSS file for styling

// Contract ABI
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "reporter",
				"type": "address"
			}
		],
		"name": "ReportSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "reporter",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"name": "ReportVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_location",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_evidenceLink",
				"type": "string"
			}
		],
		"name": "submitReport",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_newReward",
				"type": "uint256"
			}
		],
		"name": "verifyReport",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "reports",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "reporter",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "evidenceLink",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "verified",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const contractAddress = '0xe62b3888641550e4dc442ccd9ddfe048300d03c0'; // Replace with your deployed contract address

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(''); // Added location state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const webcamRef = useRef(null);

  // Connect Wallet
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const { signer: walletSigner, provider: walletProvider } = await connectWallet();
      setSigner(walletSigner);
      setProvider(walletProvider);
      setWalletConnected(true);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setWalletConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Capture Photo
  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowConfirmDialog(true);
  }, [webcamRef]);

  // Upload Photo to IPFS
  const handleUpload = async () => {
    if (!capturedImage) {
      console.log("No image captured.");
      return;
    }

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'photo.jpg');
      formData.append('description', description);

      const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJwt}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();
      if (uploadResponse.ok) {
        const ipfsUrl = `${pinataGateway}/ipfs/${result.IpfsHash}`;
        setUrl(ipfsUrl);

        // Now that we have the IPFS CID, call the Ethereum contract
        const cid = result.IpfsHash; // CID of the uploaded image
        await submitReportToContract(cid);

        setCapturedImage(null);
        setDescription('');
        setLocation('');
        setShowConfirmDialog(false);
      } else {
        console.error('Failed to upload file:', result);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Submit the report to the Ethereum contract
  const submitReportToContract = async (cid) => {
    if (!signer) {
      console.error('Wallet not connected');
      return;
    }

    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.submitReport(description, location, cid); // Calling the smart contract function
      await tx.wait(); // Wait for transaction confirmation
      console.log('Report submitted successfully:', tx);
    } catch (error) {
      console.error('Error submitting report to contract:', error);
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setDescription('');
    setLocation('');
    setShowConfirmDialog(false);
  };

  return (
    <div className="app-container">
      <h1>IPFS Photo Uploader</h1>
      {!walletConnected ? (
        <button className="connect-wallet-button" onClick={handleConnectWallet} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="webcam-section">
          {/* Conditionally render the webcam or captured photo */}
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
              />
              <button className="capture-button" onClick={capture}>Capture Photo</button>
            </>
          ) : (
            <div className="confirm-dialog">
              <h2>Confirm Photo</h2>
              <img src={capturedImage} alt="Captured" className="captured-image" />
              <textarea
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="description-input"
              />
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="location-input"
              />
              <div className="dialog-buttons">
                <button className="upload-button" onClick={handleUpload}>Upload</button>
                <button className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          )}
          {url && (
            <div className="upload-success">
              <p>Photo uploaded successfully! View at:</p>
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
