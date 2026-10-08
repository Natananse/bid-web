import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || '127.0.0.1',
      port: parseInt(this.configService.get<string>('MINIO_PORT') ?? '9000', 10),
      useSSL: false,
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadminpassword',
    });
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'bidnest-images';
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
      }
      this.logger.log('MinIO initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MinIO. Is it running? Error: ' + (error as Error).message);
    }
  }

  async uploadFile(file: Express.Multer.File, fileName: string): Promise<string> {
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );
    
    const endPoint = this.configService.get('MINIO_ENDPOINT') || '127.0.0.1';
    const port = this.configService.get('MINIO_PORT') || '9000';
    return `http://${endPoint}:${port}/${this.bucketName}/${fileName}`;
  }
}
