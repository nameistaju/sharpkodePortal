import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

export const uploadImageBuffer = async (file, folder = env.cloudinaryFolder) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) {
          reject(new AppError('Image upload failed', 500));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
};
