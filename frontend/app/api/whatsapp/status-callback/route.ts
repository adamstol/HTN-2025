// app/api/whatsapp/status-callback/route.ts

import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';

const authToken = process.env.TWILIO_AUTH_TOKEN!;

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_APP_URL + req.url;
  const headers = Object.fromEntries(req.headers);
  const body = await req.text();

  if (!validateRequest(authToken, headers['x-twilio-signature']!, url, { body })) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const form = Object.fromEntries(new URLSearchParams(body));
  const { MessageSid, MessageStatus, ErrorCode, EventType } = form;

  // Your logic: save to DB, alert user, etc.
  console.log({ MessageSid, MessageStatus, ErrorCode, EventType });

  return NextResponse.json({}, { status: 200 });
}
