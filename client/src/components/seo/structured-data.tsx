import { useEffect } from 'react';

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  author: {
    name: string;
    email?: string;
  };
  publishedAt: string;
  modifiedAt: string;
  image?: string;
  url: string;
  category?: string;
  keywords?: string[];
  readingTime?: number;
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  email?: string;
  phone?: string;
}

interface WebsiteStructuredDataProps {
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    type: string;
    target: string;
    queryInput: string;
  };
}

export function ArticleStructuredData({
  title,
  description,
  author,
  publishedAt,
  modifiedAt,
  image,
  url,
  category,
  keywords,
  readingTime,
}: ArticleStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      author: {
        '@type': 'Person',
        name: author.name,
        ...(author.email && { email: author.email }),
      },
      publisher: {
        '@type': 'Organization',
        name: 'LN Educacional',
        logo: {
          '@type': 'ImageObject',
          url: 'https://lneducacional.com.br/logo.png',
        },
      },
      datePublished: publishedAt,
      dateModified: modifiedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      ...(image && {
        image: {
          '@type': 'ImageObject',
          url: image,
        },
      }),
      ...(category && { articleSection: category }),
      ...(keywords && { keywords: keywords.join(', ') }),
      ...(readingTime && {
        timeRequired: `PT${readingTime}M`,
      }),
    };

    // Remove existing structured data for articles
    const existingScript = document.querySelector('script[type="application/ld+json"][data-type="article"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'article');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-type="article"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, author, publishedAt, modifiedAt, image, url, category, keywords, readingTime]);

  return null;
}

export function OrganizationStructuredData({
  name,
  url,
  logo,
  description,
  email,
  phone,
}: OrganizationStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: name,
      url: url,
      logo: logo,
      description: description,
      ...(email && { email: email }),
      ...(phone && { telephone: phone }),
    };

    // Remove existing organization structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'organization');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, url, logo, description, email, phone]);

  return null;
}

export function WebsiteStructuredData({
  name,
  url,
  description,
  potentialAction
}: WebsiteStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: name,
      url: url,
      description: description,
      ...(potentialAction && {
        potentialAction: {
          '@type': 'SearchAction',
          target: potentialAction.target,
          'query-input': potentialAction.queryInput,
        },
      }),
    };

    // Remove existing website structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-type="website"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'website');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-type="website"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, url, description, potentialAction]);

  return null;
}

export default {
  ArticleStructuredData,
  OrganizationStructuredData,
  WebsiteStructuredData,
};