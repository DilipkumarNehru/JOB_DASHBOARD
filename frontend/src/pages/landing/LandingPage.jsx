import LandingNavbar from '../../components/landing/LandingNavbar.jsx';
import HeroSection from '../../components/landing/HeroSection.jsx';
import FeaturesSection from '../../components/landing/FeaturesSection.jsx';
import HowItWorks from '../../components/landing/HowItWorks.jsx';
import ProductPreview from '../../components/landing/ProductPreview.jsx';
import AboutSection from '../../components/landing/AboutSection.jsx';
import MeetFounder from '../../components/landing/MeetFounder.jsx';
import WhySection from '../../components/landing/WhySection.jsx';
import TechSection from '../../components/landing/TechSection.jsx';
import FAQSection from '../../components/landing/FAQSection.jsx';
import ContactSection from '../../components/landing/ContactSection.jsx';
import LandingFooter from '../../components/landing/LandingFooter.jsx';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <ProductPreview />
        <AboutSection />
        <MeetFounder />
        <WhySection />
        <TechSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
