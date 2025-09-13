"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import FloatingBlobs from "@/components/landing/FloatingBlobs";
import { ExternalLink, MessageCircle, QrCode } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "./ui/button";
import Chat from "twilio/lib/rest/Chat";

const ScanPage = () => {
  const searchParams = useSearchParams();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const url = searchParams.get("url");

  useEffect(() => {
    const generateQRCode = async () => {
      if (!url) return;
      try {
        const qrUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 0,
          color: {
            dark: "#8BDDEB",
            light: "#232820",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    generateQRCode();
  }, [url]);

  if (!url) {
    // redirect to home
    redirect("/");
  }


  return (
      // <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="glass-card border border-border/50 bg-background/50 backdrop-blur-sm shadow-lg rounded-2xl">
            <div className="p-8 text-center space-y-4">
              {/* Header Icon */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Chat with Ember on WhatsApp!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your phone to chat with me
                </p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 bg-background/40 backdrop-blur-sm rounded-lg border border-border/20">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/50"></div>
                <span className="text-xs text-muted-foreground font-medium">OR</span>
                <div className="flex-1 h-px bg-border/50"></div>
              </div>

              {/* Open Link Button */}
              <Button
                onClick={() => window.open(url, "_blank")}
                className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium"
                size="lg"
              >
              {/* <Link
                href={url}
                target="_blank"
              > */}
                <MessageCircle className="w-4 h-4" />
                Open WhatsApp Web
              {/* </Link> */}
              </Button>
            </div>
          </div>
        </div>
      // </div>
  );
};

export default ScanPage;