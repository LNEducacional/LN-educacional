import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { FastifyMultipartOptions } from '@fastify/multipart';

interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimetype: string;
}

export const uploadConfig: FastifyMultipartOptions = {
  limits: {
    fieldNameSize: 100,
    fieldSize: 100,
    fields: 10,
    fileSize: 50 * 1024 * 1024, // 50MB for videos
    files: 1,
    headerPairs: 2000,
  },
};

export async function uploadFile(
  file: any,
  folder: 'thumbnails' | 'videos' | 'materials' | 'blog-images' | 'collaborator-docs' | 'avatars' | 'lesson-attachments'
): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), 'uploads', folder);

  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const fileExt = path.extname(file.filename);
  const fileName = `${randomUUID()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  // Save file
  const buffer = await file.toBuffer();
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${folder}/${fileName}`,
    path: filePath,
    size: buffer.length,
    mimetype: file.mimetype,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Specific validation for collaborator documents
export function validateCollaboratorDocument(file: any): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Apenas PDF, DOC, DOCX e TXT são aceitos.'
    };
  }

  if (file.file && file.file.bytesRead > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo permitido: 10MB.'
    };
  }

  return { valid: true };
}

// Upload specific for collaborator documents with validation
export async function uploadCollaboratorDocument(file: any): Promise<UploadResult> {
  const validation = validateCollaboratorDocument(file);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return uploadFile(file, 'collaborator-docs');
}

// Get file type label in Portuguese
export function getFileTypeLabel(mimetype: string): string {
  const typeLabels: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word (DOC)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)',
    'text/plain': 'Texto',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP'
  };

  return typeLabels[mimetype] || 'Arquivo';
}
