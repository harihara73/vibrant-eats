import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OTP from "@/models/OTP";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // Ensure secret is explicitly passed if env loading has issues
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[AUTH] Admin Login Attempt...");
        try {
          await connectDB();
          const user = await User.findOne({ 
            email: credentials?.email, 
            role: { $in: ["admin", "delivery"] } 
          });
          
          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(credentials?.password as string, user.password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (e) {
          console.error("[AUTH] Admin error:", e);
          return null;
        }
      }
    }),
    Credentials({
      id: "phone-login",
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        console.log("[AUTH] Phone Login Attempt...");
        try {
          await connectDB();
          const phone = (credentials?.phone as string)?.trim();
          const otp = (credentials?.otp as string)?.trim();
          
          if (!phone || !otp) {
              console.log("[AUTH] Missing phone or otp");
              return null;
          }

          // Dev backdoor
          let devCode;
          try {
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              devCode = cookieStore.get("devCode")?.value;
          } catch(err) {}

          if (process.env.NODE_ENV === 'development' && (otp === '999999' || (devCode && otp === devCode))) {
              console.log("[AUTH] Using dev backdoor (999999 or auto-fill cookie match)");
              let user = await User.findOne({ phone });
              if (!user) {
                  user = await User.create({ phone, name: `User ${phone.slice(-4)}`, role: "customer" });
              }
              return { 
                  id: user._id.toString(), 
                  name: user.name, 
                  email: user.email, 
                  phone: user.phone, 
                  role: user.role,
                  addresses: JSON.parse(JSON.stringify(user.addresses || []))
              };
          }

          console.log(`[AUTH] Checking OTP for phone: ${phone}, OTP: ${otp}`);
          
          let isValid = false;

          const latestOtp = await OTP.findOne({ phone }).sort({ createdAt: -1 });
          console.log(`[AUTH] Latest OTP record in DB:`, latestOtp);

          if (latestOtp && latestOtp.code === otp) {
              isValid = true;
          }

          if (!isValid) {
              console.log("[AUTH] Invalid OTP");
              return null;
          }

          // Cleanup
          await OTP.deleteMany({ phone });

          let user = await User.findOne({ phone });
          if (!user) {
              user = await User.create({ phone, name: `User ${phone.slice(-4)}`, role: "customer" });
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            addresses: JSON.parse(JSON.stringify(user.addresses || []))
          };
        } catch (e: any) {
          console.error("[AUTH] Phone error:", e.message || e);
          return null;
        }
      }
    })
  ]
});
