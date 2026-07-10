import { useLocation, useNavigate } from 'react-router-dom';

export default function VideoPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  // Expecting video URL to be passed via React Router state context
  const videoUrl = location.state?.videoUrl || "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";

  return (
    <div className="w-screen h-screen bg-black relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 text-white text-xl z-10 flex items-center gap-2 bg-black bg-opacity-50 p-2 rounded-full"
      >
        ⬅ Back
      </button>
      <video 
        className="w-full h-full object-contain" 
        src={videoUrl} 
        controls 
        autoPlay 
        progress
      />
    </div>
  );
}