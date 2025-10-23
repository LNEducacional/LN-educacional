"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadConfig = void 0;
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
exports.validateCollaboratorDocument = validateCollaboratorDocument;
exports.uploadCollaboratorDocument = uploadCollaboratorDocument;
exports.getFileTypeLabel = getFileTypeLabel;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
exports.uploadConfig = {
    limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 10,
        fileSize: 50 * 1024 * 1024, // 50MB for videos
        files: 5, // Permite múltiplos arquivos (work file + thumbnail + preview + extras)
        headerPairs: 2000,
    },
};
async function uploadFile(file, folder) {
    const uploadDir = path_1.default.join(process.cwd(), 'uploads', folder);
    // Ensure upload directory exists
    await fs_1.promises.mkdir(uploadDir, { recursive: true });
    const fileExt = path_1.default.extname(file.filename);
    const fileName = `${(0, crypto_1.randomUUID)()}${fileExt}`;
    const filePath = path_1.default.join(uploadDir, fileName);
    // Save file
    const buffer = await file.toBuffer();
    await fs_1.promises.writeFile(filePath, buffer);
    return {
        url: `/uploads/${folder}/${fileName}`,
        path: filePath,
        size: buffer.length,
        mimetype: file.mimetype,
    };
}
async function deleteFile(filePath) {
    try {
        await fs_1.promises.unlink(filePath);
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
}
// Specific validation for collaborator documents
function validateCollaboratorDocument(file) {
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
async function uploadCollaboratorDocument(file) {
    const validation = validateCollaboratorDocument(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    return uploadFile(file, 'collaborator-docs');
}
// Get file type label in Portuguese
function getFileTypeLabel(mimetype) {
    const typeLabels = {
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
//# sourceMappingURL=upload.service.js.map