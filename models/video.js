const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  url: {
    type: String,
  },
  channelName: {
    type: String,
  },
  publishedAt: {
    type: String,
  },
  uploadStatus: {
    type: String,
  },
  videoId: {
    type: String,
  },
  privacyStatus: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Video", videoSchema);
