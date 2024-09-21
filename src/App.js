import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage'; // Import the LandingPage
import AppContent from './AppContent';  // Import the new AppContent

// Conditionally set basename for production (for GitHub Pages or any subpath hosting)
const basename = process.env.NODE_ENV === 'production' ? '/ipfs' : '/';

function App() {
  return (
    <Router basename={basename}>
      <Routes>
        {/* Define route for the LandingPage */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Define route for the main wallet connection app */}
        <Route path="/app" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
