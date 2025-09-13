import { MessageCircle } from "lucide-react";
import { env } from "@/lib/constants";

const WhatsAppCTA = () => {
  const handleWhatsAppClick = () => {
    // Replace with actual WhatsApp number/link
    const message = encodeURIComponent(`Hey! I'm interested in Ember at ${env.LOCATION_ID === "uofc" ? "UCalgary" : "UWaterloo"} 🚀`);
    const whatsappUrl = `https://wa.me/1234567890?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed top-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 animate-pulse-glow"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-medium">Message me on WhatsApp</span>
    </button>
  );
};

export default WhatsAppCTA;