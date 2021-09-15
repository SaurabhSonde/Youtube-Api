const express = require("express");
const {
  authenticate,
  callback,
  uploadVideo,
  upload,
  broadcastVideo,
} = require("../controllers/upload");
const router = express.Router();

router.get("/", authenticate);
router.get("/google/callback", callback);
router.post("/upload", upload, uploadVideo);
router.post("/broadcast", upload, broadcastVideo);

module.exports = router;
