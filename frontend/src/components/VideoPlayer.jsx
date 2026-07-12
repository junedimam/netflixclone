import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function VideoPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [playbackError, setPlaybackError] = useState('');
  // Expecting video URL to be passed via React Router state context
  const videoUrl = location.state?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <div className="w-screen h-screen bg-black relative flex items-center justify-center">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 text-white text-md z-10 flex items-center gap-2 bg-black bg-opacity-70 px-4 py-2 rounded-full border border-gray-800 hover:bg-opacity-90 transition duration-200"
      >
        ← Back
      </button>
      <video 
        className="w-full h-full object-contain" 
        src={videoUrl} 
        controls 
        autoPlay 
        playsInline
        onError={() => setPlaybackError('This video could not be loaded. Please go back and try another title.')}
      />
      {playbackError && (
        <p className="absolute bottom-8 mx-4 rounded bg-red-950/90 border border-red-700 px-4 py-3 text-sm text-red-100">
          {playbackError}
        </p>
      )}
    </div>
  );
}
