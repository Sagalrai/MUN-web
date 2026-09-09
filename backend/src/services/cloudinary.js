import { v2 as cloudinary } from 'cloudinary';

export const supportedImageTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export const uploadImageBuffer = (buffer, options = {}) => new Promise((resolve, reject) => {
  if (!buffer?.length) return reject(new Error('Image file is empty'));
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return reject(new Error('Cloudinary storage is not configured'));
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const stream = cloudinary.uploader.upload_stream({
    folder: options.folder || 'qrmun',
    resource_type: 'image',
    ...options,
  }, (error, result) => error ? reject(error) : resolve(result));

  stream.end(buffer);
});

export default cloudinary;
