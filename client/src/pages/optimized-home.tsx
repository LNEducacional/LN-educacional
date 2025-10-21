import React, { Suspense, useEffect } from 'react';
import {
  PrioritySuspense,
  StreamingSuspenseList,
  SuspenseWrapper,
  ViewportSuspense,
} from '../components/suspense/SuspenseWrapper';
import { InlineLoadingSpinner } from '../components/ui/loading-spinner';
import { LazyWrapper, createLazyComponent, useSmartPrefetch } from '../lib/lazy-loading';
import {
  useComponentPerformance,
  useNetworkPerformance,
  usePerformanceMetrics,
  useWebVitals,
} from '../lib/performance-metrics';
import {
  ResourceHints,
  useDynamicResourceHints,
  useIntersectionResourceHint,
} from '../lib/resource-hints';

// Lazy load heavy components
const HeroSection = createLazyComponent(() => import('../components/sections/Hero'), {
  priority: 'high',
  chunkName: 'hero',
  preload: true,
});

const FeaturedCourses = createLazyComponent(
  () => import('../components/sections/FeaturedCourses'),
  { priority: 'normal', chunkName: 'featured-courses', prefetch: true }
);

const Testimonials = createLazyComponent(() => import('../components/sections/Testimonials'), {
  priority: 'low',
  chunkName: 'testimonials',
});

const Statistics = createLazyComponent(() => import('../components/sections/Statistics'), {
  priority: 'idle',
  chunkName: 'statistics',
});

const Newsletter = createLazyComponent(() => import('../components/sections/Newsletter'), {
  priority: 'idle',
  chunkName: 'newsletter',
});

// Optimized Home Page with React 19 Features
export default function OptimizedHomePage() {
  // Performance tracking
  useWebVitals();
  useComponentPerformance('OptimizedHomePage');
  useNetworkPerformance();
  useSmartPrefetch();

  const { trackMetric } = usePerformanceMetrics();

  // Track page load time
  useEffect(() => {
    const pageLoadTime = performance.now();
    trackMetric('page_load_time', pageLoadTime);

    // Mark important milestones
    performance.mark('page-interactive');

    return () => {
      performance.mark('page-complete');
      performance.measure('page-render-time', 'page-interactive', 'page-complete');
    };
  }, [trackMetric]);

  // Dynamic resource hints for images
  const heroRef = React.useRef<HTMLDivElement>(null);
  useIntersectionResourceHint(heroRef, [
    { type: 'preload', href: '/images/hero-bg.jpg', as: 'image' },
    { type: 'preload', href: '/images/hero-illustration.svg', as: 'image' },
  ]);

  // Additional resource hints based on user interaction
  useDynamicResourceHints([
    { type: 'dns-prefetch', href: 'https://api.lneducacional.com.br' },
    { type: 'preconnect', href: 'https://cdn.lneducacional.com.br' },
  ]);

  return (
    <>
      {/* Resource Hints in Head */}
      <ResourceHints />

      <div className="min-h-screen">
        {/* Critical: Hero Section - Immediate Priority */}
        <PrioritySuspense priority="immediate">
          <section ref={heroRef} className="relative">
            <LazyWrapper
              component={HeroSection}
              fallback={<HeroSkeleton />}
              onLoad={() => trackMetric('hero_loaded', performance.now())}
            />
          </section>
        </PrioritySuspense>

        {/* High Priority: Featured Courses */}
        <PrioritySuspense priority="high">
          <section className="py-16">
            <SuspenseWrapper fallback={<CoursesSkeleton />} delay={100}>
              <FeaturedCourses />
            </SuspenseWrapper>
          </section>
        </PrioritySuspense>

        {/* Streaming List: Benefits & Features */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Por que escolher a LN Educacional?
            </h2>

            <StreamingSuspenseList revealOrder="forwards" tail="collapsed">
              <BenefitCard
                icon="🎓"
                title="Educação de Qualidade"
                description="Conteúdo desenvolvido por especialistas"
              />
              <BenefitCard
                icon="💻"
                title="100% Online"
                description="Estude onde e quando quiser"
              />
              <BenefitCard
                icon="📜"
                title="Certificado Válido"
                description="Reconhecido em todo o Brasil"
              />
              <BenefitCard
                icon="🤝"
                title="Suporte Dedicado"
                description="Equipe pronta para ajudar"
              />
            </StreamingSuspenseList>
          </div>
        </section>

        {/* Viewport-based Loading: Statistics */}
        <ViewportSuspense fallback={<StatisticsSkeleton />} rootMargin="200px">
          <section className="py-16">
            <Statistics />
          </section>
        </ViewportSuspense>

        {/* Low Priority: Testimonials */}
        <PrioritySuspense priority="low">
          <section className="py-16 bg-gray-50">
            <SuspenseWrapper fallback={<TestimonialsSkeleton />} progressive>
              <Testimonials />
            </SuspenseWrapper>
          </section>
        </PrioritySuspense>

        {/* Idle Priority: Newsletter */}
        <ViewportSuspense fallback={<NewsletterSkeleton />} rootMargin="500px">
          <section className="py-16">
            <PrioritySuspense priority="idle">
              <Newsletter />
            </PrioritySuspense>
          </section>
        </ViewportSuspense>
      </div>
    </>
  );
}

// Benefit Card Component (Server Component candidate)
function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const renderTime = useComponentPerformance(`BenefitCard-${title}`);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <span className="text-4xl">{icon}</span>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-gray-400">Render: {renderTime.toFixed(2)}ms</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton Components for Progressive Loading
function HeroSkeleton() {
  return <div className="h-[600px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />;
}

function CoursesSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function NewsletterSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="max-w-2xl mx-auto h-64 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  );
}
