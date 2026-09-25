require('dotenv').config();
const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

let imagekitInstance = null;

const hasValidCredentials = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  return (
    publicKey &&
    privateKey &&
    urlEndpoint &&
    publicKey.trim() !== '' &&
    privateKey.trim() !== '' &&
    urlEndpoint.trim() !== '' &&
    !publicKey.includes('your_') &&
    !privateKey.includes('your_')
  );
};

const getImageKit = () => {
  if (imagekitInstance) {
    return imagekitInstance;
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint
  });

  return imagekitInstance;
};

/**
 * Upload an image buffer to ImageKit (or fallback to local /uploads/ if ImageKit is unconfigured)
 * @param {Object} file - Express Multer file object (buffer, originalname, mimetype)
 * @param {string} folder - Destination folder name (e.g., 'posts', 'avatars')
 * @returns {Promise<{ imageUrl: string, imageFileId: string }>}
 */
const uploadToImageKit = async (file, folder = 'posts') => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided for upload');
  }

  const cleanFilename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  if (hasValidCredentials()) {
    try {
      const ik = getImageKit();
      const result = await ik.upload({
        file: file.buffer.toString('base64'),
        fileName: cleanFilename,
        folder: `/snapfeed/${folder}`
      });

      return {
        imageUrl: result.url,
        imageFileId: result.fileId
      };
    } catch (error) {
      console.error(`❌ [ImageKit] Upload error: ${error.message}`);
      throw new Error(`ImageKit upload failed: ${error.message}`);
    }
  }

  // Graceful local fallback for development before ImageKit keys are configured
  console.warn(
    '⚠️  [ImageKit] Credentials not configured in Backend/.env. Saving file locally to /uploads/'
  );

  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, cleanFilename);
  fs.writeFileSync(localFilePath, file.buffer);

  const port = process.env.PORT || 5000;
  const baseUrl = process.env.CLIENT_URL ? `http://localhost:${port}` : `http://localhost:${port}`;

  return {
    imageUrl: `${baseUrl}/uploads/${cleanFilename}`,
    imageFileId: `local_${cleanFilename}`
  };
};

/**
 * Delete an image by its file ID from ImageKit (or local /uploads/)
 * @param {string} fileId - The ImageKit fileId or local file identifier
 */
const deleteFromImageKit = async (fileId) => {
  if (!fileId) return;

  if (fileId.startsWith('local_')) {
    const filename = fileId.replace('local_', '');
    const localFilePath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn(`[LocalFile] Could not delete local file ${filename}: ${err.message}`);
      }
    }
    return;
  }

  if (hasValidCredentials()) {
    try {
      const ik = getImageKit();
      await ik.deleteFile(fileId);
    } catch (error) {
      console.warn(`⚠️ [ImageKit] Could not delete file ${fileId}: ${error.message}`);
    }
  }
};

module.exports = {
  getImageKit,
  uploadToImageKit,
  deleteFromImageKit,
  hasValidCredentials
};
