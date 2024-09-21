import React, { useState, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, RotateCcw, Upload, Send, Eye, RefreshCw } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false); // Track upload status

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
    setIsUploading(true);
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
      setIsUploaded(true); // Mark as uploaded
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
    } finally {
      setIsUploading(false);
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

  const handleRecapture = () => {
    setCapturedImage(null);
    setIsWebcamOn(true);
    setIsUploaded(false); // Reset upload status for new capture
  };

  return (
    <motion.div 
      className="flex flex-col items-center bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-bold text-indigo-800 mb-6">Capture Evidence</h2>
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
        <motion.div 
          className="w-full space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <img src={capturedImage} alt="Captured" className="mb-4 w-full rounded-lg shadow-lg" />

          {!isUploaded && ( // Conditionally render upload button
            <motion.button
              className={`bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-full text-white w-full flex items-center justify-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleUpload}
              disabled={isUploading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="mr-2" size={20} />
              {isUploading ? 'Uploading...' : 'Upload to IPFS'}
            </motion.button>
          )}

          {uploadUrl && (
            <>
              <motion.button
                className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full text-white w-full flex items-center justify-center"
                onClick={handleSubmitReport}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="mr-2" size={20} />
                Submit Report
              </motion.button>
              <motion.button
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full text-white w-full flex items-center justify-center"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="mr-2" size={20} />
                View IPFS URL
              </motion.button>
            </>
          )}

          <motion.button
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-full text-white w-full flex items-center justify-center"
            onClick={handleRecapture}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="mr-2" size={20} />
            Recapture Photo
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          className="w-full space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button 
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-full text-white w-full flex items-center justify-center"
            onClick={capture}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="mr-2" size={20} />
            Capture Photo
          </motion.button>
          <motion.button 
            className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-full text-white w-full flex items-center justify-center"
            onClick={toggleCamera}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="mr-2" size={20} />
            Switch to {isFrontCamera ? 'Back' : 'Front'} Camera
          </motion.button>
        </motion.div>
      )}
      {isModalOpen && <Modal uploadUrl={uploadUrl} closeModal={() => setIsModalOpen(false)} />}
    </motion.div>
  );
}

export default WebcamCapture;
