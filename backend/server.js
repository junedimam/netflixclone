const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const localStore = require('./lib/store');
const Movie = require('./models/Movie');
const seedMovies = require('./lib/seedMovies');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/movies', require('./routes/movies'));
app.use('/api/auth', require('./routes/auth'));

async function seedMongoDB() {
  try {
    const count = await Movie.countDocuments();
    if (count === 0) {
      console.log("Seeding MongoDB with default movies...");
      for (const movie of seedMovies) {
        const { _id, ...movieData } = movie;
        await Movie.create(movieData);
      }
      console.log(`Seeded ${seedMovies.length} movies into MongoDB.`);
    } else {
      console.log(`MongoDB already has ${count} movies. Skipping seed.`);
    }
  } catch (err) {
    console.warn(`Seed error: ${err.message}. Continuing without seeding.`);
  }
}

async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  try {
    if (!mongoUri) throw new Error('MONGO_URI is not configured');
    console.log("Attempting to connect to MongoDB...");
    // 10-second timeout to allow MongoDB to be ready
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("Successfully connected to MongoDB!");
    
    // Seed movies into MongoDB
    await seedMongoDB();
  } catch (err) {
    console.warn(`MongoDB is unavailable (${err.message}). Using persistent local data in backend/data/store.json.`);
    localStore.initialise();
    app.locals.useLocalStore = true;
  }

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();