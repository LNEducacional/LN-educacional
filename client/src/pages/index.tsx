import { AboutSection } from '@/components/about-section';
import { BenefitsSection } from '@/components/benefits-section';
import { CoursesSection } from '@/components/courses-section';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { ServicesSection } from '@/components/services-section';
import { TestimonialsSection } from '@/components/testimonials-section';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header showSearch={false} showNotifications={false} />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <TestimonialsSection />
        <CoursesSection />
        <BenefitsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
