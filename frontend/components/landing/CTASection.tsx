import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useEmailSignup } from "@/hooks/use-email-signup";
import { isValidUniversityEmail, getEmailValidationError } from "@/lib/email-utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { env } from "@/lib/constants";

const CTASection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { signUpWithEmail, isLoading, waitlistEmail } = useEmailSignup();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    // Check if it's a valid university email
    if (!isValidUniversityEmail(email)) {
      const errorMessage = getEmailValidationError(email);
      setError(errorMessage);
      return;
    }

    try {
      setIsSubmitted(true);
      await signUpWithEmail(email);
    } catch (err) {
      setError('Failed to process your request. Please try again.');
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="glass-card p-12 rounded-3xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to{" "}
            <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
            find your people
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let&apos;s chat for a few minutes and the rest is on me😉
          </p>

          {isLoggedIn ? (
            <Button
              onClick={() => router.push('/profile')}
              size="lg"
              className="rounded-full px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Profile
            </Button>
          ) : !waitlistEmail ? (
            <motion.form
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-2">
                <div className="flex items-center bg-background/50 backdrop-blur-xs rounded-full border border-border/50 p-1 max-w-md mx-auto">
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
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass-card p-6 rounded-2xl max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">🎉 You&rsquo;re on the waitlist!</h3>
                <p className="text-sm text-muted-foreground">We&rsquo;ll notify you at {waitlistEmail} when we expand to your university.</p>
              </div>
            </motion.div>
          )}

          {/* <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Free to join
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              University students only
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Launching Fall 2025
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default CTASection;