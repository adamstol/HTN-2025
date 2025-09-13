import { Linkedin, Instagram, Twitter } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://linkedin.com/company/getorbitapp",
      icon: Linkedin,
    },
    {
      name: "Instagram",
      url: "https://instagram.com/psycho.baller",
      icon: Instagram,
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/rami__maalouf",
      icon: Twitter,
    },
    {
      name: "Substack",
      url: "https://open.substack.com/pub/ramimaalouf/p/the-courage-to-be-chalant?r=2klqgv&utm_campaign=post&utm_medium=web&showWelcomeOnShare=false",
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.539 24V10.812H1.46zM22.539 0H1.46v2.836h21.08V0z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative z-10 mt-20 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-display font-semibold mb-6 bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
              Connect with Ember
            </h3>

            <div className="flex justify-center items-center space-x-6 mb-6">
              {socialLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-full glass-card hover:scale-110 transition-all duration-300"
                    aria-label={link.name}
                  >
                    <IconComponent className="w-5 h-5 text-foreground/70 group-hover:text-primary transition-colors" />
                  </a>
                );
              })}
            </div>

            <div className="text-sm text-foreground/60">
              <p>&copy; 2025 Ember. Effortless connections for university students.</p>
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;