import path from 'node:path';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance, FastifyReply } from 'fastify';

export async function registerCompression(app: FastifyInstance) {
  // Register compression plugin
  await app.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses larger than 1KB
    encodings: ['gzip', 'deflate', 'br'], // Support multiple encodings
    customTypes: /^text\/|^application\/(?:json|javascript|xml)|^image\/svg\+xml/,

    // Brotli configuration
    brotliOptions: {
      params: {
        [require('node:zlib').constants.BROTLI_PARAM_MODE]:
          require('node:zlib').constants.BROTLI_MODE_TEXT,
        [require('node:zlib').constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },

    // Gzip configuration
    zlibOptions: {
      level: 6, // Balance between compression and CPU usage
    },

    // Request/response size limits
    requestEncodings: ['gzip', 'deflate'],
  });

  // Serve static files with proper caching
  if (process.env.NODE_ENV === 'production') {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, '../../uploads'),
      prefix: '/uploads/',
      constraints: {}, // Optional route constraints
      cacheControl: true,
      maxAge: 31536000, // 1 year
      immutable: true,
      lastModified: true,
      etag: true,

      // Set cache headers
      setHeaders: (res, path, _stat) => {
        if (path.endsWith('.pdf')) {
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for PDFs
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for images
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour default
        }

        // Security headers for downloads
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
      },
    });
  }

  app.log.info('Compression plugin registered successfully');
}

// CDN configuration helper
export function getCDNUrl(path: string): string {
  const cdnUrl = process.env.CDN_URL;

  if (!cdnUrl || process.env.NODE_ENV !== 'production') {
    return path; // Return original path in development
  }

  // Ensure CDN URL doesn't end with slash and path starts with slash
  const cleanCdnUrl = cdnUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanCdnUrl}${cleanPath}`;
}

// Cache headers utility helpers
function buildCacheDirectives(options: {
  maxAge: number;
  sMaxAge?: number;
  mustRevalidate: boolean;
  noCache: boolean;
  noStore: boolean;
  isPrivate: boolean;
  immutable: boolean;
}): string[] {
  const { maxAge, sMaxAge, mustRevalidate, noCache, noStore, isPrivate, immutable } = options;
  const directives: string[] = [];

  if (noStore) {
    directives.push('no-store');
    return directives;
  }

  if (noCache) {
    directives.push('no-cache');
    return directives;
  }

  directives.push(isPrivate ? 'private' : 'public');

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (immutable) {
    directives.push('immutable');
  }

  return directives;
}

// Cache headers utility
export function setCacheHeaders(
  reply: FastifyReply,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    mustRevalidate?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    private?: boolean;
    immutable?: boolean;
  } = {}
) {
  const {
    maxAge = 0,
    sMaxAge,
    mustRevalidate = false,
    noCache = false,
    noStore = false,
    private: isPrivate = false,
    immutable = false,
  } = options;

  const directives = buildCacheDirectives({
    maxAge,
    sMaxAge,
    mustRevalidate,
    noCache,
    noStore,
    isPrivate,
    immutable,
  });

  reply.header('Cache-Control', directives.join(', '));
}

// Content type cache configuration helpers
function getCacheConfigForContentType(contentType: string) {
  // API responses
  if (contentType.includes('application/json')) {
    return {
      maxAge: 0,
      noCache: true,
      mustRevalidate: true,
    };
  }

  // Static assets
  if (contentType.match(/image\/(jpeg|jpg|png|gif|webp|svg)/)) {
    return {
      maxAge: 31536000, // 1 year
      immutable: true,
    };
  }

  // CSS and JavaScript
  if (
    contentType.match(/text\/(css|javascript)/) ||
    contentType.includes('application/javascript')
  ) {
    return {
      maxAge: 31536000, // 1 year
      immutable: true,
    };
  }

  // HTML
  if (contentType.includes('text/html')) {
    return {
      maxAge: 3600, // 1 hour
      mustRevalidate: true,
    };
  }

  // PDFs and documents
  if (contentType.includes('application/pdf')) {
    return {
      maxAge: 86400, // 1 day
    };
  }

  return null;
}

function applyCacheHeadersForContentType(reply: FastifyReply, contentType: string) {
  const cacheConfig = getCacheConfigForContentType(contentType);
  if (cacheConfig) {
    setCacheHeaders(reply, cacheConfig);
  }
}

// Response optimization middleware
export function optimizeResponse(app: FastifyInstance) {
  app.addHook('onSend', async (_request, reply, payload) => {
    const contentType = reply.getHeader('content-type');

    if (typeof contentType === 'string') {
      applyCacheHeadersForContentType(reply, contentType);
    }

    return payload;
  });
}
