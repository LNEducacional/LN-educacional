import type { FastifyMultipartOptions } from '@fastify/multipart';
interface UploadResult {
    url: string;
    path: string;
    size: number;
    mimetype: string;
}
export declare const uploadConfig: FastifyMultipartOptions;
export declare function uploadFile(file: any, folder: 'thumbnails' | 'videos' | 'materials' | 'blog-images' | 'collaborator-docs'): Promise<UploadResult>;
export declare function deleteFile(filePath: string): Promise<void>;
export declare function validateCollaboratorDocument(file: any): {
    valid: boolean;
    error?: string;
};
export declare function uploadCollaboratorDocument(file: any): Promise<UploadResult>;
export declare function getFileTypeLabel(mimetype: string): string;
export {};
//# sourceMappingURL=upload.service.d.ts.map