import { createClient } from "@/lib/supabase/server";
import { VapiClient } from "@vapi-ai/server-sdk";
import { NextResponse } from "next/server";


const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { phone: phone_number } = await request.json();

    // Validate phone number format (US/Canada)
    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update user's phone number in the database
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          phone_number,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error("Failed to update profile");
    }

    // Send VAPI request
    const response = await vapi.calls.create({
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
      customer: {
        // name: "User",
        number: phone_number,
      },
      workflowId: process.env.VAPI_WORKFLOW_ID!,
    });


    if (!response) {
      console.error("Error sending verification code:", response);
      throw new Error("Failed to send verification code");
    }

    // insert call into database
    const { data, error } = await supabase
      .from("calls")
      .upsert({
        // @ts-expect-error - Type will be handled by the database
        vapi_call_id: response.id,
        user_id: user.id,
      }, { onConflict: "vapi_call_id" })
      .select();

    console.log("VAPI response:", response);

    return new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in phone number update:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
