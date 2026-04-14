import { NextResponse } from "next/server";
import OTP from "@/models/OTP";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log(`[${new Date().toLocaleTimeString()}] OTP Send Request Received`);
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await connectDB();
    
    // Save to DB (expires in 5 mins automatically)
    await OTP.deleteMany({ phone });
    await OTP.create({ phone, code, createdAt: new Date() });

    // --- SMS DELIVERY LOGIC ---
    let smsSent = false;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 1. Try Twilio (if keys provided)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            // Integration code would go here
            console.log("[SMS] Attempting real SMS delivery via Twilio...");
            // smsSent = true;
        } catch (smsErr) {
            console.error("[SMS] Twilio Failed:", smsErr);
        }
    }

    // fallback: MOCK SMS (Terminal)
    if (!smsSent) {
        console.log("\n--- [MOCK SMS] ---");
        console.log(`To: ${phone}`);
        console.log(`Your verification code is: ${code}`);
        console.log("------------------\n");
    }

    // --- RESPONSE LOGIC ---
    // If no real SMS was sent, we provide the code to the UI as 'devCode'
    // This allows testing in production without real SMS integrated yet.
    const shouldReturnDevCode = !smsSent; 

    const user = await User.findOne({ phone });

    if (shouldReturnDevCode) {
        const cookieStore = await cookies();
        cookieStore.set('devCode', code, { maxAge: 300, path: '/' });
    }

    return NextResponse.json({ 
      success: true, 
      message: smsSent ? "OTP sent to your phone!" : "OTP sent (Simulation Mode)",
      isNewUser: !user || !user.name || user.name.startsWith("User "),
      ...(shouldReturnDevCode ? { devCode: code } : {})
    });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
