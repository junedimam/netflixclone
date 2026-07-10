const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  thumbnailUrl: { type: String, required: true },
  videoUrl: { type: String, required: true }, // URL to cloud storage video file
  genre: { type: String },
  duration: { type: String },
  isSeries: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);