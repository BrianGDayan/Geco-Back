import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('oldPublicId') oldPublicId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo en el campo "file".');
    }

    if (oldPublicId) {
      await this.cloudinaryService.deleteImage(oldPublicId);
    }

    const result = await this.cloudinaryService.uploadImage(file.buffer);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
