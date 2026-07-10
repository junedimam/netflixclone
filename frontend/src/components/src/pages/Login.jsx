import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the JWT token and user info in localStorage
        localStorage.setItem('user', JSON.stringify(data));
        // Redirect user to the home page / browse page
        navigate('/');
      } else {
        setError(data);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex justify-center items-center">
      <form onSubmit={handleLogin} className="bg-black bg-opacity-85 p-16 rounded-md flex flex-col w-96 border border-gray-700">
        <h2 className="text-white text-3xl font-bold mb-6">Sign In</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <input 
          type="email" 
          placeholder="Email" 
          className="p-3 mb-4 bg-gray-700 rounded text-white outline-none"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="p-3 mb-6 bg-gray-700 rounded text-white outline-none"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" className="bg-red-600 text-white p-3 rounded font-semibold hover:bg-red-700">
          Sign In
        </button>
      </form>
    </div>
  );
}