import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid'; // 👈 IMPORTANTE

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'planillas-detalles',
          public_id: uuidv4(),
          use_filename: false,
          unique_filename: false,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        }
      );
      stream.end(buffer);
    });
  }
}
