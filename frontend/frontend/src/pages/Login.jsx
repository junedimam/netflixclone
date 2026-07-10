// This is inside frontend/src/pages/Login.jsx
const handleLogin = async (e) => {
  e.preventDefault();

  // 1. The Frontend reaches out across the network to the Backend's URL:
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', // Telling the backend we are sending data
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }), // Sending the typed credentials
  });

  const data = await response.json();
  // ... handling the token response follows
};