import type { FastifyInstance, FastifyReply } from 'fastify';
export declare function registerCompression(app: FastifyInstance): Promise<void>;
export declare function getCDNUrl(path: string): string;
export declare function setCacheHeaders(reply: FastifyReply, options?: {
    maxAge?: number;
    sMaxAge?: number;
    mustRevalidate?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    private?: boolean;
    immutable?: boolean;
}): void;
export declare function optimizeResponse(app: FastifyInstance): void;
//# sourceMappingURL=compression.d.ts.map