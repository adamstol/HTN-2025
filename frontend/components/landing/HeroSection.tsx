import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailSignup } from "@/hooks/use-email-signup";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import WhatsAppButton from "../WhatsAppButton";
import { env } from "@/lib/constants";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);
  const { signUpWithEmail, isLoading } = useEmailSignup();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      setIsSubmitted(true);
      await signUpWithEmail(email);
      // Show WhatsApp button immediately after successful university email submission
      setShowWhatsAppButton(true);
    } catch (err) {
      setError('Failed to process your request. Please try again.');
      setShowWhatsAppButton(false);
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 text-center max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl 2xl:text-8xl font-display font-bold mb-1 sm:mb-2 md:mb-4">
          I&apos;m Ember, your AI{" "}
            <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
              university superconnector
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {/* I bring you exactly who you&apos;re looking for at the */}
            {/* I go wherever you go to find you someone */}
            Let&apos;s chat and I&apos;ll connect you with exactly who you&apos;re looking for. Whether it&apos;s friends, clubs, group project buddies, or even a life partner, I got you covered.
          </p>
        </div>

        {isLoggedIn ? (
          <Button
            onClick={() => router.push('/profile')}
            size="lg"
            className="rounded-full px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Go to Profile
          </Button>
        ) : !showWhatsAppButton ? (
          <motion.div
            className="glass-card p-6 rounded-3xl max-w-md mx-auto mb-8"
            animate={isSubmitted ? { scale: 0.98, opacity: 0.8 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center bg-background/50 backdrop-blur-xs rounded-full border border-border/50 p-1">
                  <Input
                    type="email"
                    placeholder={`your@${env.LOCATION_ID === "uofc" ? "ucalgary" : "uwaterloo"}.ca`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Clear error when user types
                      if (error) setError(null);
                    }}
                    className="flex-1 border-0 bg-transparent text-sm px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || isSubmitted}
                    size="sm"
                    className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading || isSubmitted ? "Sending..." : "Join"}
                  </Button>
                </div>
                {error && (
                  <p className="text-xs text-red-500 px-4">
                    {error}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Enter your{env.LOCATION_ID !== "uofc" ? "Canadian" : ""} University{env.LOCATION_ID === "uofc" ? " of Calgary" : ""} email to get started
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div
            className="glass-card p-6 rounded-3xl max-w-md mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium mb-2">🎉 Welcome to the Ember network!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let&apos;s chat on WhatsApp and get to know each other right away!
              </p>
              <div className="flex justify-center flex-col">
                <WhatsAppButton
                  phoneNumber={process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER!}
                  message="hey what's all this about?"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* <div className="animate-pulse-glow">
          <p className="text-lg text-muted-foreground">
            ✨ Launching at University of Calgary this Fall
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default HeroSection;