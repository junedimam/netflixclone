const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataFile = path.join(dataDir, 'store.json');

const defaultMovies = require('./seedMovies');

function readStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    const initial = { users: [], movies: defaultMovies };
    fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    store.users ||= [];
    store.movies ||= [];
    // Remove seed records created by versions prior to the distinct-film catalog.
    // Uploaded movies use generated IDs and are left untouched.
    const hadLegacySamples = store.movies.some((movie) => movie._id?.startsWith('sample-'));
    if (hadLegacySamples) {
      store.movies = store.movies.filter((movie) => !movie._id?.startsWith('sample-'));
    }
    const presentIds = new Set(store.movies.map((movie) => movie._id));
    const missingSamples = defaultMovies.filter((movie) => !presentIds.has(movie._id));
    if (hadLegacySamples || missingSamples.length) {
      store.movies.push(...missingSamples);
      writeStore(store);
    }
    return store;
  } catch {
    return { users: [], movies: defaultMovies };
  }
}

function writeStore(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

module.exports = {
  initialise() {
    readStore();
  },
  users: {
    findByEmail(email) {
      return readStore().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    },
    findByUsername(username) {
      return readStore().users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    },
    create(user) {
      const store = readStore();
      const created = { _id: id(), isAdmin: false, createdAt: new Date().toISOString(), ...user };
      store.users.push(created);
      writeStore(store);
      return created;
    }
  },
  movies: {
    all() {
      return readStore().movies.slice().reverse();
    },
    random() {
      const movies = readStore().movies;
      return movies.length ? movies[Math.floor(Math.random() * movies.length)] : null;
    },
    create(movie) {
      const store = readStore();
      const created = { _id: id(), createdAt: new Date().toISOString(), ...movie };
      store.movies.push(created);
      writeStore(store);
      return created;
    }
  }
};