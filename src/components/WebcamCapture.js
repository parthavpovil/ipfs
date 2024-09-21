import React, { useState, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import Modal from './Modal';
import { pinata } from '../utils/config';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/contract';

function WebcamCapture({ walletAddress, signer }) {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [uploadUrl, setUploadUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // Track upload status

  const videoConstraints = {
    facingMode: isFrontCamera ? 'user' : { exact: 'environment' },
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsWebcamOn(false);
    }
  }, [webcamRef]);

  const handleUpload = async () => {
    if (!capturedImage) return;
    setIsUploading(true); // Start uploading
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
      setUploadUrl(ipfsUrl); // Set upload URL after success
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
    } finally {
      setIsUploading(false); // End uploading
    }
  };

  const handleSubmitReport = async () => {
    if (!uploadUrl) return;
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.submitReport("Report Description", "Report Location", uploadUrl);
      await tx.wait();
      console.log("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const toggleCamera = () => {
    setIsFrontCamera((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center">
      {isWebcamOn && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="mb-4 w-full rounded-lg shadow-md"
        />
      )}
      {capturedImage ? (
        <>
          <img src={capturedImage} alt="Captured" className="mb-4 w-full rounded-lg shadow-lg" />
          <button
            className={`bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg text-white mb-4 w-full ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleUpload}
            disabled={isUploading} // Disable button while uploading
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>

          {/* Conditionally render Submit Report and View IPFS URL buttons */}
          {uploadUrl && (
            <>
              <button
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white mb-4 w-full"
                onClick={handleSubmitReport}
              >
                Submit Report
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white w-full"
                onClick={() => setIsModalOpen(true)}
              >
                View IPFS URL
              </button>
            </>
          )}
        </>
      ) : (
        <button className="bg-blue-500 mb-4 hover:bg-blue-600 px-4 py-2 rounded-lg text-white w-full" onClick={capture}>
          Capture Photo
        </button>
      )}
      {!capturedImage && (
        <button className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-white mb-4 w-full" onClick={toggleCamera}>
          Switch to {isFrontCamera ? 'Back' : 'Front'} Camera
        </button>
      )}
      {isModalOpen && <Modal uploadUrl={uploadUrl} closeModal={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default WebcamCapture;
