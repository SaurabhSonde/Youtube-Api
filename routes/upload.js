const express = require("express");
const {
  authenticate,
  callback,
  uploadVideo,
  upload,
  broadcastVideo,
  uploadThumbnail,
} = require("../controllers/upload");
const router = express.Router();

router.get("/", authenticate);
router.get("/google/callback", callback);
router.post("/upload", upload, uploadVideo);
router.post("/upload/thumbnail", upload, uploadThumbnail);
router.post("/broadcast", upload, broadcastVideo);

module.exports = router;
