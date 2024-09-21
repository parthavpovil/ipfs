import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook

function LandingPage() {
  const [showSteps, setShowSteps] = useState(false);
  const navigate = useNavigate(); // Initialize navigate function

  const handleGetStarted = () => {
    navigate('/app'); // Navigate to the wallet connection page
  };

  const handleHowToUse = () => {
    setShowSteps(!showSteps);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex justify-between items-center p-4">
        <div className="text-xl font-bold">INTOUCH</div>
        <div className="flex items-center space-x-4">
          <a href="#" className="text-gray-600 hover:text-gray-800">How to use?</a>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Select Wallet
          </button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-15 flex flex-col lg:flex-row items-center justify-between">
        <div className="lg:w-1/2 mb-8 lg:mb-0">
          <div className="relative">
            <img src="https://i.imgur.com/nywH83H.png" alt="Creator" className="w-30 h-30 py" />
          </div>
        </div>
        
        <div className="lg:w-1/2 text-center lg:text-left">
          <p className="text-xl text-gray-600 mb-6">
            Traffix empowers citizens to anonymously and securely report reckless driving, earning rewards while contributing to safer roads and making road safety a community-driven mission.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-700" onClick={handleGetStarted}>
            Let's Get Started
          </button>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
