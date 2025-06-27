import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Sube una imagen a Cloudinary y devuelve la respuesta.
   * @param filePath Ruta al archivo en disco (por ejemplo, multer lo deja en `/tmp/...`).
   */
  async uploadImage(filePath: string): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(filePath, {
      folder: 'planilla-specs',       // carpeta opcional en tu cuenta Cloudinary
      use_filename: true,
      unique_filename: false,
    });
  }
}
