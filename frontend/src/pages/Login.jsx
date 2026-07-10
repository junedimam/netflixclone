import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { username, email, password } : { email, password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setSuccess("Account created successfully! Please sign in.");
          setIsRegister(false);
          setUsername('');
          setPassword('');
        } else {
          // Save the JWT token and user info in localStorage
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
          navigate('/');
        }
      } else {
        setError(typeof data === 'string' ? data : (data.error || "Authentication failed."));
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div 
      className="w-screen h-screen flex justify-center items-center relative bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://assets.nflxext.com/ffe/siteui/vlv3/ab610711-479e-4c30-ba95-8905103919d3/77960e3d-57ef-409e-85c4-6f2ece22d3a4/US-en-20240902-TRIFECTA-perspective_WEB_a2b0577d-7880-496a-93d3-7d885a069412_large.jpg')` }}
    >
      {/* Header Logo */}
      <div className="absolute top-0 left-0 p-8">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" 
          alt="Netflix Logo" 
          className="h-10" 
        />
      </div>

      <form onSubmit={handleSubmit} className="bg-black bg-opacity-80 p-16 rounded-md flex flex-col w-[450px] border border-neutral-900 shadow-2xl">
        <h2 className="text-white text-3xl font-bold mb-6">{isRegister ? 'Sign Up' : 'Sign In'}</h2>
        
        {error && <p className="text-red-500 bg-red-900 bg-opacity-30 border border-red-800 text-sm p-3 rounded mb-4">{error}</p>}
        {success && <p className="text-green-400 bg-green-900 bg-opacity-30 border border-green-800 text-sm p-3 rounded mb-4">{success}</p>}
        
        {isRegister && (
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            className="p-3.5 mb-4 bg-neutral-800 bg-opacity-90 rounded text-white outline-none border border-neutral-700 focus:border-neutral-500 focus:bg-neutral-700 transition"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          className="p-3.5 mb-4 bg-neutral-800 bg-opacity-90 rounded text-white outline-none border border-neutral-700 focus:border-neutral-500 focus:bg-neutral-700 transition"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          className="p-3.5 mb-6 bg-neutral-800 bg-opacity-90 rounded text-white outline-none border border-neutral-700 focus:border-neutral-500 focus:bg-neutral-700 transition"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" className="bg-netflixRed text-white p-3.5 rounded font-semibold hover:bg-red-700 transition duration-200 shadow-lg">
          {isRegister ? 'Sign Up' : 'Sign In'}
        </button>

        <p className="text-neutral-500 mt-6 text-sm">
          {isRegister ? 'Already have an account?' : 'New to Netflix?'} 
          <span 
            className="text-white cursor-pointer ml-1 hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
          >
            {isRegister ? 'Sign In now.' : 'Sign Up now.'}
          </span>
        </p>
      </form>
    </div>
  );
}
