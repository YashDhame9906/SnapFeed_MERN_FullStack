const multer = require('multer');
const { sendError } = require('../utils/response');

// Store files in memory buffer for direct forwarding to ImageKit
const storage = multer.memoryStorage();

// Allowed image MIME types per Section 9
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum file size limit
  },
  fileFilter
});

/**
 * Higher-order middleware to handle single file uploads with friendly error handling
 * @param {string} fieldName - The multipart form-data field name (e.g. 'image', 'profileImage')
 */
const uploadSingle = (fieldName) => {
  const multerMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 400, 'Image file size is too large. Maximum allowed size is 5MB.');
        }
        return sendError(res, 400, err.message || 'File upload error');
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle
};
