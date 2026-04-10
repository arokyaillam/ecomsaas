import { FastifyInstance } from 'fastify';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Upload configuration
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = extname(originalName).toLowerCase();
  return `${timestamp}-${random}${ext}`;
}

// Validate file
function validateFile(mimeType: string, size: number): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Max size: 5MB' };
  }
  return { valid: true };
}

export default async function uploadRoutes(fastify: FastifyInstance) {
  // Ensure upload directory on startup
  await ensureUploadDir();

  // Get server URL for constructing full URLs
  const getServerUrl = () => {
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '8000';
    return `http://${host}:${port}`;
  };

  // Pre-handler hook to authenticate requests
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { storeId?: string };
      if (!user?.storeId) {
        return reply.status(401).send({ error: 'Invalid token: missing storeId' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // POST /api/upload - Upload single image
  fastify.post('/', async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Validate file
      const validation = validateFile(data.mimetype, data.file.bytesRead || 0);
      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error });
      }

      const filename = generateFilename(data.filename);
      const filepath = join(UPLOAD_DIR, filename);

      // Read file buffer and write to disk
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      // Return the full URL
      const serverUrl = getServerUrl();
      const fileUrl = `${serverUrl}/uploads/${filename}`;

      return reply.send({
        success: true,
        url: fileUrl,
        filename: filename
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to upload file' });
    }
  });

  // POST /api/upload/multiple - Upload multiple images
  fastify.post('/multiple', async (request, reply) => {
    try {
      const files = await request.files();
      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      for await (const data of files) {
        try {
          // Validate file
          const validation = validateFile(data.mimetype, data.file.bytesRead || 0);
          if (!validation.valid) {
            errors.push(`${data.filename}: ${validation.error}`);
            continue;
          }

          const filename = generateFilename(data.filename);
          const filepath = join(UPLOAD_DIR, filename);

          const buffer = await data.toBuffer();
          await writeFile(filepath, buffer);

          uploadedUrls.push(`${getServerUrl()}/uploads/${filename}`);
        } catch (err) {
          errors.push(`${data.filename}: Failed to process`);
        }
      }

      return reply.send({
        success: errors.length === 0,
        urls: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      fastify.log.logError(error);
      return reply.status(500).send({ error: 'Failed to upload files' });
    }
  });

  // POST /api/upload/base64 - Upload base64 image (for backward compatibility)
  fastify.post('/base64', async (request, reply) => {
    try {
      const { image, filename = 'image.jpg' } = request.body as { image: string; filename?: string };

      if (!image || !image.startsWith('data:image/')) {
        return reply.status(400).send({ error: 'Invalid base64 image data' });
      }

      // Extract mime type and base64 data
      const matches = image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches) {
        return reply.status(400).send({ error: 'Invalid base64 image format' });
      }

      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Validate
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({ error: 'File too large. Max size: 5MB' });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return reply.status(400).send({ error: 'Invalid file type' });
      }

      const generatedFilename = generateFilename(filename);
      const filepath = join(UPLOAD_DIR, generatedFilename);

      await writeFile(filepath, buffer);

      return reply.send({
        success: true,
        url: `${getServerUrl()}/uploads/${generatedFilename}`,
        filename: generatedFilename
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to upload file' });
    }
  });
}
