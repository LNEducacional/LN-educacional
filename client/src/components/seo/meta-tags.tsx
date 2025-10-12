import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  siteName?: string;
}

export function MetaTags({
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  siteName = 'LN Educacional',
}: MetaTagsProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ${siteName}`;
    }

    // Helper function to set or update meta tag
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
      }
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('article:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Set basic meta tags
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description);
      setMetaTag('twitter:description', description);
    }

    if (keywords && keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    // Set Open Graph tags
    if (title) {
      setMetaTag('og:title', title);
      setMetaTag('twitter:title', title);
    }

    setMetaTag('og:type', type);
    setMetaTag('og:site_name', siteName);

    if (canonicalUrl) {
      setMetaTag('og:url', canonicalUrl);
      setLinkTag('canonical', canonicalUrl);
    }

    if (ogImage) {
      setMetaTag('og:image', ogImage);
      setMetaTag('twitter:image', ogImage);
      setMetaTag('twitter:card', 'summary_large_image');
    }

    // Set article-specific tags
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime);
      }
      if (author) {
        setMetaTag('article:author', author);
      }
    }

    // Clean up function to remove meta tags when component unmounts
    return () => {
      // Note: We don't remove meta tags on cleanup as they should persist
      // until the next page load or until they are updated by another component
    };
  }, [
    title,
    description,
    keywords,
    ogImage,
    canonicalUrl,
    type,
    publishedTime,
    modifiedTime,
    author,
    siteName,
  ]);

  return null; // This component doesn't render anything visible
}

export default MetaTags;