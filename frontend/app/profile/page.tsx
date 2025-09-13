// import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";
import WhatsAppButton from "@/components/WhatsAppButton";

export default async function ProfilePage() {
  // Authentication removed - page is now publicly accessible
  // const supabase = await createClient();

  // Get user session
  // const { data, error: authError } = await supabase.auth.getClaims();
  // if (authError || !data?.claims) {
  //   redirect("/");
  // }
  // const claims = data.claims;

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          Ready to find your people?
        </h1>

          <div className="text-left">
            <p className="text-muted-foreground mb-6">
              I&apos;m excited to get to know you more! Let&apos;s chat on WhatsApp
            </p>
            <WhatsAppButton
              phoneNumber={process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER!}
              message="hey what's all this about?"
            />
          </div>
      </div>
    </div>
  );
}
