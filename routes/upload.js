const express = require("express");
const {
  authenticate,
  callback,
  uploadVideo,
  upload,
} = require("../controllers/upload");
const router = express.Router();

router.get("/", authenticate);
router.get("/google/callback", callback);
router.post("/upload", upload, uploadVideo);

module.exports = router;
