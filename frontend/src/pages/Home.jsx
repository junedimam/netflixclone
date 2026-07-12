import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Featured from '../components/Featured';
import { API_URL } from '../api';

export default function Home({ setUser }) {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [isSeries, setIsSeries] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchMovies = () => {
    fetch(`${API_URL}/api/movies`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMovies(data);
        }
      })
      .catch(err => console.log('Error fetching movies:', err));
  };

  const matchingMovies = movies.filter((movie) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [movie.title, movie.genre, movie.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploadProgress('Uploading files, please wait...');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genre', genre);
    formData.append('duration', duration);
    formData.append('isSeries', isSeries);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    if (videoFile) formData.append('video', videoFile);

    try {
      const response = await fetch(`${API_URL}/api/movies`, {
        method: 'POST',
        body: formData, // Automatically sets correct multipart header
      });

      const data = await response.json();

      if (response.ok) {
        setUploadProgress('Upload completed successfully!');
        // Reset form
        setTitle('');
        setDescription('');
        setGenre('');
        setDuration('');
        setIsSeries(false);
        setThumbnailFile(null);
        setVideoFile(null);
        setShowUploadModal(false);
        // Refresh list
        fetchMovies();
      } else {
        setError(data.error || 'Failed to upload movie');
        setUploadProgress('');
      }
    } catch (err) {
      setError('Network error during upload');
      setUploadProgress('');
    }
  };

  return (
    <div className="bg-[#111] min-h-screen text-white pb-20">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-transparent flex items-center justify-between px-12 z-50">
        <div className="flex items-center gap-8">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" 
            alt="Netflix" 
            className="h-6 cursor-pointer"
            onClick={() => window.location.reload()}
          />
          <span className="text-sm font-semibold cursor-pointer">Home</span>
          <span className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer">TV Shows</span>
          <span className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer">Movies</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="bg-netflixRed text-white px-4 py-1.5 rounded font-semibold text-sm hover:bg-red-700 transition"
          >
            + Upload Movie
          </button>
          <span className="text-sm text-gray-300">Welcome, {user?.username}</span>
          <button 
            onClick={handleLogout} 
            className="text-gray-300 hover:text-white text-sm hover:underline"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Featured Header */}
      <Featured />

      {/* Movies List Section */}
      <div id="browse-section" className="px-12 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold">
              {searchQuery ? `Results for “${searchQuery}”` : 'Latest Content'}
            </h2>
            {searchQuery && <p className="text-sm text-gray-400 mt-1">{matchingMovies.length} related video{matchingMovies.length === 1 ? '' : 's'} found</p>}
          </div>
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-2.5 text-gray-400">⌕</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by movie name or genre"
              aria-label="Search movies"
              className="w-full bg-zinc-900 border border-gray-600 rounded py-2 pl-9 pr-9 text-sm text-white placeholder-gray-400 outline-none focus:border-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-2 text-gray-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {movies.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-lg p-16 text-center text-gray-500">
            <p className="mb-4">No videos found. Upload a video file to test the player!</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-opacity-80 transition"
            >
              Upload Your First Movie
            </button>
          </div>
        ) : matchingMovies.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-lg p-12 text-center text-gray-400">
            No movies found for “{searchQuery}”. Try a title, genre, or description.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {matchingMovies.map((movie) => (
              <div 
                key={movie._id}
                onClick={() => navigate('/watch', { state: { videoUrl: movie.videoUrl } })}
                className="bg-zinc-900 rounded overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 hover:shadow-2xl transition duration-300"
              >
                <div className="relative aspect-video">
                  <img 
                    src={movie.thumbnailUrl} 
                    alt={movie.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-200">
                    <span className="bg-white bg-opacity-80 rounded-full p-2.5 text-black text-xl font-bold">▶</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{movie.duration}</span>
                    <span className="border border-gray-700 px-1 rounded uppercase text-[10px]">
                      {movie.genre || 'Action'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-8 relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => {
                setShowUploadModal(false);
                setError('');
                setUploadProgress('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-6 text-white border-b border-zinc-800 pb-2">Upload Movie / Video File</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Movie Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  placeholder="e.g. Sintel" 
                  className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded text-white focus:outline-none focus:border-red-600"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Enter a brief plot synopsis..." 
                  className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded text-white h-20 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Genre</label>
                  <input 
                    type="text" 
                    value={genre} 
                    onChange={(e) => setGenre(e.target.value)} 
                    placeholder="e.g. Sci-Fi" 
                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    placeholder="e.g. 1h 45m" 
                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isSeries"
                  checked={isSeries}
                  onChange={(e) => setIsSeries(e.target.checked)}
                  className="accent-netflixRed w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isSeries" className="text-sm cursor-pointer select-none">Is this a TV Series?</label>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Thumbnail Image *</label>
                <input 
                  type="file" 
                  accept="image/*"
                  required
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Video File (.mp4, etc) *</label>
                <input 
                  type="file" 
                  accept="video/*"
                  required
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 file:cursor-pointer"
                />
              </div>

              {error && <p className="text-red-500 text-xs bg-red-900 bg-opacity-20 border border-red-900 p-2 rounded">{error}</p>}
              {uploadProgress && <p className="text-yellow-500 text-xs bg-yellow-900 bg-opacity-10 border border-yellow-900 p-2 rounded">{uploadProgress}</p>}

              <button 
                type="submit" 
                className="w-full bg-netflixRed hover:bg-red-700 text-white font-semibold py-3 rounded mt-4 transition shadow-lg"
              >
                Start Uploading
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
