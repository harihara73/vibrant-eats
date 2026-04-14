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

    // MOCK SMS: Log to terminal
    console.log("\n--- [MOCK SMS] ---");
    console.log(`To: ${phone}`);
    console.log(`Your verification code is: ${code}`);
    console.log("------------------\n");

    const user = await User.findOne({ phone });

    if (process.env.NODE_ENV === 'development') {
        const cookieStore = await cookies();
        cookieStore.set('devCode', code, { maxAge: 300, path: '/' });
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent to your terminal console!",
      isNewUser: !user || !user.name || user.name.startsWith("User "),
      ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {})
    });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
