import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { twilioClient } from '@/lib/twilio';
import { runSessionedFlow } from '@/lib/pocketflow/flow';
import { env } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(
      formData.entries()
    );

    const twilioSignature = request.headers.get('x-twilio-signature');
    // 2) Reconstruct the EXACT public URL Twilio hit (don’t use req.url if behind proxy)
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const url = `${proto}://${host}/api/whatsapp/webhook`;

    // Validate the request is from Twilio
    const validator = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature || '',
      url,
      body
    );

    if (!validator) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const message = body.Body.toString();
    const from = body.From.toString();
    const profileName = body.ProfileName.toString();
    const fromNumber = from.replace("whatsapp:", "");

    console.log(`Received message from ${from}: ${message}`);

    const [firstName, lastName] = profileName.split(" ");

    // await twilioClient.messages.create({
    //   body: `Hey${profileName ? ` ${profileName}` : ''}, I'm a lil busy rn, but I'll get back to you asap!`,
    //   from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    //   to: from
    // });

    if (message.toLowerCase() === "hey what's all this about?") {
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      await twilioClient.messages.create({
        body: `hey${firstName ? ` ${firstName}` : ''} i'm ember, ${env.LOCATION_ID === "uofc" ? "ucalgary" : "uwaterloo"}'s AI superconnector.

I help you find exactly who/what you're looking for. Whether that's a friend, a club, a group project partner, a mentor, or even your next date😏

Here's how it works:

1. We chat or call (yes, you can call me) so I get to know you a lil more and who you're hoping to meet.
2. I build a connection profile that reflects who you are and who you want to meet.
3. Then I find someone on campus who matches that vibe and fits your schedule (a.k.a we'll try to match you with someone who's in your class, or who goes to the same lunch area as you)
4. I share your profiles (only if you both approve), and set up a group chat (through email because whatsapp doesn't allow me to do so😔) so y'all can chat and hopefully meet up`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return new NextResponse(`<Response><Message>oh and also make sure you confirm your ${env.LOCATION_ID === "uofc" ? "ucalgary" : "uwaterloo"} email with the link I sent you</Message></Response>`, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const flow = await runSessionedFlow({
      sessionId: fromNumber,
      fromPhone: fromNumber,
      message,
      profileName,
    });

    console.log(flow);


    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // await twilioClient.messages.create({
    //   body: "while I still can't text, in the meantime feel free to call me. I'd love to get to know you more over the phone",
    //   from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    //   to: from
    // });
    // await new Promise((resolve) => setTimeout(resolve, 5000));
    // await twilioClient.messages.create({
    //   body: "oh and also make sure you confirm your ucalgary email with the link I sent you",
    //   from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    //   to: from
    // });

    return NextResponse.json({
      success: true,
      code: 200,
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      success: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}