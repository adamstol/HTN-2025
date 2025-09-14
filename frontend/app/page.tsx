"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailSignup } from "@/hooks/use-email-signup";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import WhatsAppButton from "@/components/WhatsAppButton";
import { env } from "@/lib/constants";
import { Mic } from "lucide-react";
import Link from "next/link";

const Index = () => {
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
      {/* Floating Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-blob w-96 h-96 top-1/4 left-1/4 animate-float"></div>
        <div className="floating-blob w-80 h-80 top-3/4 right-1/4 animate-float" style={{animationDelay: '10s'}}></div>
        <div className="floating-blob w-72 h-72 bottom-1/4 left-1/2 animate-float" style={{animationDelay: '5s'}}></div>
      </div>

      <div className="relative z-10 text-center max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl 2xl:text-8xl font-display font-bold mb-1 sm:mb-2 md:mb-4">
            <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
              7 Degrees
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your conversations into actionable insights with advanced AI transcription,
            speaker identification, and intelligent analysis.
          </p>
        </div>

        {/* Technology Stack */}
        <div className="glass-card p-6 rounded-2xl max-w-sm mx-auto mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Powered by Advanced AI</h3>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 py-1">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              <span className="text-muted-foreground text-sm">OpenAI Whisper Transcription</span>
            </div>
            <div className="flex items-center space-x-3 py-1">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              <span className="text-muted-foreground text-sm">GPT Speaker Identification</span>
            </div>
            <div className="flex items-center space-x-3 py-1">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              <span className="text-muted-foreground text-sm">Gemini AI Analysis</span>
            </div>
          </div>
        </div>

        {isLoggedIn ? (
          <div className="flex justify-center">
            <Link href="/record">
              <button className="bg-primary/25 backdrop-blur-lg border border-primary/30 rounded-full px-8 py-3 text-xl font-medium text-white flex items-center justify-center space-x-3 hover:bg-primary/35 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <Mic className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            </Link>
          </div>
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
                    placeholder={`example@gmail.com`}
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
                Enter your email to get started
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
              <h3 className="text-lg font-medium mb-2">🎉 Welcome to the 7 Degrees network!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Let&apos;s chat and get to know each other right away!
              </p>
              <div className="flex justify-center flex-col">
                <Link href="/record">
                  <button className="inline-block px-4 py-2 rounded-lg bg-primary/50 text-white hover:bg-primary/75 transition">
                    Go to Record Page
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Index;
