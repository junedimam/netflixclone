import { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  // Use state so React re-renders routes when the user logs in or out
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user'));
  });

  return (
    <Router>
      <Routes>
        {/* If logged in, show Home. If not, redirect to Login */}
        <Route path="/" element={user ? <Home setUser={setUser} /> : <Navigate to="/login" />} />
        
        {/* If logged in, redirect away from login page back to Home */}
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
        
        {/* Protected Video Streaming Route */}
        <Route path="/watch" element={user ? <VideoPlayer /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}