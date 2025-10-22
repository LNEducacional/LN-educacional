/**
 * YouTube Utilities
 * Helper functions for validating and extracting YouTube video information
 */
/**
 * Extracts the video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export declare function extractYouTubeVideoId(url: string): string | null;
/**
 * Validates if a URL is a valid YouTube video URL
 */
export declare function isValidYouTubeUrl(url: string): boolean;
/**
 * Generates the embed URL for a YouTube video
 */
export declare function getYouTubeEmbedUrl(url: string): string | null;
/**
 * Generates the thumbnail URL for a YouTube video
 */
export declare function getYouTubeThumbnailUrl(url: string, quality?: 'default' | 'hq' | 'mq' | 'sd' | 'maxres'): string | null;
/**
 * Validates and processes a YouTube URL
 * Returns the embed URL if valid, or throws an error if invalid
 */
export declare function processYouTubeUrl(url: string): {
    originalUrl: string;
    videoId: string;
    embedUrl: string;
    thumbnailUrl: string;
};
//# sourceMappingURL=youtube.d.ts.map