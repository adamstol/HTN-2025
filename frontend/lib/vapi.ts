// full on vapi client
import { VapiClient } from "@vapi-ai/server-sdk";

export const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

export const vapi_phone_number = process.env.TWILIO_PHONE_NUMBER!;
export const vapi_phone_number_id = process.env.VAPI_PHONE_NUMBER_ID!;
export const vapi_workflow_id = process.env.VAPI_WORKFLOW_ID!;

export async function fetchTranscript(callId: string) {
  const call = await vapi.calls.get(callId, {
    headers: {
      "Accept": "application/json",

    },
  });
  console.log("call", call);
  return call;
}
