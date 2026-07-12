const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataFile = path.join(dataDir, 'store.json');

const sampleVideo = 'https://media.w3.org/2010/05/bunny/trailer.mp4';
const legacyDefaultMovies = [
  {
    _id: 'sample-big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A cheerful animated adventure about a gentle rabbit and a few mischievous woodland creatures.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80',
    videoUrl: sampleVideo,
    genre: 'Animation',
    duration: '9m 56s',
    isSeries: false
  },
  {
    _id: 'sample-elephants-dream',
    title: 'Elephants Dream',
    description: 'A surreal open movie set in a vast, mysterious machine.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    genre: 'Sci-Fi',
    duration: '10m 53s',
    isSeries: false
  },
  {
    _id: 'sample-sintel',
    title: 'Sintel',
    description: 'A young woman searches for her lost dragon companion in a beautifully animated fantasy world.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    genre: 'Fantasy',
    duration: '14m 48s',
    isSeries: false
  },
  {
    _id: 'sample-bigger-blazes',
    title: 'Bigger Blazes',
    description: 'A fast, cinematic sample short with bright action and motion.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    genre: 'Action', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bigger-escapes',
    title: 'Bigger Escapes',
    description: 'A quick road-trip short made for a fast watch.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    videoUrl: sampleVideo,
    genre: 'Adventure', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bigger-fun',
    title: 'Bigger Fun',
    description: 'A lively short feature for a quick entertainment break.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    genre: 'Comedy', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bigger-joyrides',
    title: 'Bigger Joyrides',
    description: 'A fast-paced driving short with an energetic feel.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    genre: 'Action', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bigger-meltdowns',
    title: 'Bigger Meltdowns',
    description: 'An action-packed sample short with a dramatic finish.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7451?auto=format&fit=crop&w=900&q=80',
    videoUrl: sampleVideo,
    genre: 'Thriller', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-subaru-outback',
    title: 'Outback Journey',
    description: 'A short drive through city streets and open country.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    genre: 'Adventure', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-tears-of-steel',
    title: 'Tears of Steel',
    description: 'A science-fiction short about a team trying to reconnect with the past.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    genre: 'Sci-Fi', duration: '12m 14s', isSeries: false
  },
  {
    _id: 'sample-gti-review',
    title: 'GTI Review',
    description: 'A concise automotive short with road-test footage.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    videoUrl: sampleVideo,
    genre: 'Documentary', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bullrun',
    title: 'Bullrun',
    description: 'A high-energy road adventure captured as a short feature.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    genre: 'Adventure', duration: 'Short film', isSeries: false
  },
  {
    _id: 'sample-bunny-encore',
    title: 'Bunny Encore',
    description: 'A short animated feature starring the beloved Big Buck Bunny.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=900&q=80',
    videoUrl: sampleVideo,
    genre: 'Animation', duration: '9m 56s', isSeries: false
  }
];
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
