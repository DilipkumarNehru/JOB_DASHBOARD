import LandingNavbar from '../../components/landing/LandingNavbar.jsx';
import HeroSection from '../../components/landing/HeroSection.jsx';
import LiveAtsDemo from '../../components/landing/LiveAtsDemo.jsx';
import LiveJobPreview from '../../components/landing/LiveJobPreview.jsx';
import FeaturesSection from '../../components/landing/FeaturesSection.jsx';
import ProductPreview from '../../components/landing/ProductPreview.jsx';
import RoiCalculator from '../../components/landing/RoiCalculator.jsx';
import TestimonialsSection from '../../components/landing/TestimonialsSection.jsx';
import HowItWorks from '../../components/landing/HowItWorks.jsx';
import WhySection from '../../components/landing/WhySection.jsx';
import AboutSection from '../../components/landing/AboutSection.jsx';
import MeetFounder from '../../components/landing/MeetFounder.jsx';
import TechSection from '../../components/landing/TechSection.jsx';
import FAQSection from '../../components/landing/FAQSection.jsx';
import ContactSection from '../../components/landing/ContactSection.jsx';
import LandingFooter from '../../components/landing/LandingFooter.jsx';

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <LiveAtsDemo />
        <LiveJobPreview />
        <FeaturesSection />
        <ProductPreview />
        <RoiCalculator />
        <TestimonialsSection />
        <HowItWorks />
        <WhySection />
        <AboutSection />
        <MeetFounder />
        <TechSection />
        <FAQSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
