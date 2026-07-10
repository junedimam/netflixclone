const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

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
    console.log("Attempting to connect to MongoDB Atlas...");
    // 4-second timeout to avoid long hangs
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (err) {
    console.warn("\n>>> [WARNING] Could not connect to MongoDB Atlas cluster.");
    console.warn(">>> Spawning a local, temporary in-memory MongoDB database instead...\n");
    
    try {
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log("Successfully connected to local in-memory database!");
    } catch (memErr) {
      console.error("Critical error: Failed to start in-memory database server:", memErr.message);
      process.exit(1);
    }
  }

  app.listen(5000, () => {
    console.log('Server running on port 5000');
  });
}

startServer();