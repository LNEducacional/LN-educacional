"use strict";
/**
 * YouTube Utilities
 * Helper functions for validating and extracting YouTube video information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractYouTubeVideoId = extractYouTubeVideoId;
exports.isValidYouTubeUrl = isValidYouTubeUrl;
exports.getYouTubeEmbedUrl = getYouTubeEmbedUrl;
exports.getYouTubeThumbnailUrl = getYouTubeThumbnailUrl;
exports.processYouTubeUrl = processYouTubeUrl;
/**
 * Extracts the video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
function extractYouTubeVideoId(url) {
    if (!url)
        return null;
    // Remove whitespace
    url = url.trim();
    // Regular expression patterns for different YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/, // Just the ID
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}
/**
 * Validates if a URL is a valid YouTube video URL
 */
function isValidYouTubeUrl(url) {
    return extractYouTubeVideoId(url) !== null;
}
/**
 * Generates the embed URL for a YouTube video
 */
function getYouTubeEmbedUrl(url) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId)
        return null;
    return `https://www.youtube.com/embed/${videoId}`;
}
/**
 * Generates the thumbnail URL for a YouTube video
 */
function getYouTubeThumbnailUrl(url, quality = 'hq') {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId)
        return null;
    const qualityMap = {
        default: 'default',
        mq: 'mqdefault',
        hq: 'hqdefault',
        sd: 'sddefault',
        maxres: 'maxresdefault',
    };
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
/**
 * Validates and processes a YouTube URL
 * Returns the embed URL if valid, or throws an error if invalid
 */
function processYouTubeUrl(url) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        throw new Error('URL inválida do YouTube. Formatos aceitos: youtube.com/watch?v=ID ou youtu.be/ID');
    }
    const embedUrl = getYouTubeEmbedUrl(url);
    const thumbnailUrl = getYouTubeThumbnailUrl(url);
    if (!embedUrl || !thumbnailUrl) {
        throw new Error('Não foi possível processar a URL do YouTube');
    }
    return {
        originalUrl: url,
        videoId,
        embedUrl,
        thumbnailUrl,
    };
}
//# sourceMappingURL=youtube.js.map