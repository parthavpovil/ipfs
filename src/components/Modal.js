import React from 'react';

function Modal({ uploadUrl, closeModal }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">IPFS URL</h2>
        <p className="break-all mb-4">
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {uploadUrl}
          </a>
        </p>
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white w-full" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;
