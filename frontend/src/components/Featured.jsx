import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

export default function Featured() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/movies/random`)
      .then(res => {
        if (!res.ok) throw new Error('No movies');
        return res.json();
      })
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => {
        setContent(null);
        setLoading(false);
      });
  }, []);

  const handlePlay = () => {
    if (content?.videoUrl) {
      navigate('/watch', { state: { videoUrl: content.videoUrl } });
    }
  };

  if (loading) {
    return (
      <div className="h-[85vh] flex justify-center items-center bg-black text-gray-400">
        Loading Featured Movie...
      </div>
    );
  }

  // Fallback if database is empty
  const displayTitle = content?.title || "Welcome to Netflix Clone";
  const displayDesc = content?.description || "Click the upload button below to add movies/shows, upload video files directly, and watch them stream live.";
  const displayThumbnail = content?.thumbnailUrl || "https://images.unsplash.com/photo-1574267431629-2e570984a83d?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="relative h-[85vh] text-white bg-black">
      <img src={displayThumbnail} alt={displayTitle} className="w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
      
      <div className="absolute bottom-[20%] left-12 max-w-xl z-10">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-md">{displayTitle}</h1>
        <p className="text-lg mb-6 text-gray-200 drop-shadow-sm">{displayDesc}</p>
        <div className="flex gap-4">
          {content?.videoUrl && (
            <button 
              onClick={handlePlay}
              className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-opacity-80 transition duration-200 flex items-center gap-2"
            >
              ▶ Play
            </button>
          )}
          <a 
            href="#browse-section"
            className="bg-gray-500 bg-opacity-60 text-white px-6 py-2 rounded font-semibold hover:bg-opacity-40 transition duration-200"
          >
            ℹ Browse Movies
          </a>
        </div>
      </div>
    </div>
  );
}
