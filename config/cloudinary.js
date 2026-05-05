const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'AasaiPet/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage });

const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = Boolean(file?.mimetype && file.mimetype.startsWith('video/'));
    return {
      folder: 'AasaiPet/gallery',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'webm', 'mov', 'm4v']
        : ['jpg', 'jpeg', 'png', 'webp'],
      ...(isVideo ? {} : { transformation: [{ width: 1400, height: 1400, crop: 'limit' }] }),
    };
  },
});

const galleryUpload = multer({ storage: galleryStorage });

module.exports = { cloudinary, upload, galleryUpload };
