"use client";
import FloatingBlobs from "@/components/landing/FloatingBlobs";
import HeroSection from "@/components/landing/HeroSection";
import MissionSection from "@/components/landing/MissionSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {

  return (
    <div className="min-h-screen overflow-x-hidden">
      <FloatingBlobs />

      <main className="relative z-10">
        <HeroSection />
        <MissionSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
