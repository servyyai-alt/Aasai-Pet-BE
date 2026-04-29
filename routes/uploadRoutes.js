const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../config/cloudinary');

router.post('/image', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) { return res.status(400).json({ message: 'No file uploaded' }); }
  res.json({ url: req.file.path, public_id: req.file.filename });
});

router.delete('/image', protect, admin, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.body.public_id);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
