import FloatingBlobs from "@/components/landing/FloatingBlobs";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative">
      <FloatingBlobs />
      <main className="flex-1 flex items-center justify-center relative z-10">
        {children}
      </main>
    </div>
  );
}
