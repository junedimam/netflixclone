const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const localStore = require('./lib/store');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/movies', require('./routes/movies'));
app.use('/api/auth', require('./routes/auth'));

async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  try {
    if (!mongoUri) throw new Error('MONGO_URI is not configured');
    console.log("Attempting to connect to MongoDB Atlas...");
    // 4-second timeout to avoid long hangs
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (err) {
    console.warn(`MongoDB is unavailable (${err.message}). Using persistent local data in backend/data/store.json.`);
    localStore.initialise();
    app.locals.useLocalStore = true;
  }

  const port = Number(process.env.PORT) || 5001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
