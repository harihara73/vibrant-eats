import { NextResponse } from "next/server";
import OTP from "@/models/OTP";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { cookies } from "next/headers";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log(`[${new Date().toLocaleTimeString()}] Email OTP Send Request Received`);
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await connectDB();
    
    // Save to DB (expires in 5 mins automatically)
    await OTP.deleteMany({ email });
    await OTP.create({ email, code, createdAt: new Date() });

    // --- EMAIL DELIVERY LOGIC ---
    let emailSent = false;
    
    if (process.env.RESEND_API_KEY) {
        try {
            console.log("[Email] Attempting real delivery via Resend...");
            const { data, error } = await resend.emails.send({
                from: 'VibrantEats <onboarding@resend.dev>', // You should update this to your domain later
                to: [email],
                subject: 'Your VibrantEats Login Code',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #dc2626; text-align: center;">Welcome to VibrantEats</h2>
                        <p style="font-size: 16px; color: #333;">Hello,</p>
                        <p style="font-size: 16px; color: #333;">Your verification code for logging into VibrantEats is:</p>
                        <div style="background: #fdf2f2; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #dc2626;">${code}</span>
                        </div>
                        <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 5 minutes.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
            });

            if (error) {
                console.error("[Email] Resend Error:", error);
            } else {
                console.log("[Email] Sent successfully:", data?.id);
                emailSent = true;
            }
        } catch (emailErr) {
            console.error("[Email] Unexpected error:", emailErr);
        }
    }

    // fallback: MOCK EMAIL (Terminal)
    if (!emailSent) {
        console.log("\n--- [MOCK EMAIL] ---");
        console.log(`To: ${email}`);
        console.log(`Your verification code is: ${code}`);
        console.log("------------------\n");
    }

    // --- RESPONSE LOGIC ---
    // If no real email was sent, we provide the code to the UI as 'devCode'
    const shouldReturnDevCode = !emailSent; 

    const user = await User.findOne({ email });

    if (shouldReturnDevCode) {
        const cookieStore = await cookies();
        cookieStore.set('devCode', code, { maxAge: 300, path: '/' });
    }

    return NextResponse.json({ 
      success: true, 
      message: emailSent ? "OTP sent to your email!" : "OTP sent (Simulation Mode)",
      isNewUser: !user || !user.name || user.name.startsWith("User "),
      ...(shouldReturnDevCode ? { devCode: code } : {})
    });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
