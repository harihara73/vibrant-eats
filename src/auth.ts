import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
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
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              role: "customer"
            });
          }
          return true;
        } catch (err) {
          console.error("[AUTH] Google Sign In DB Error:", err);
          return true; // Still allow sign in even if DB sync fails
        }
      }
      return true;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
      id: "email-login",
      name: "Email Login",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        console.log("[AUTH] Email Login Attempt...");
        try {
          await connectDB();
          const email = (credentials?.email as string)?.trim().toLowerCase();
          const otp = (credentials?.otp as string)?.trim();
          
          if (!email || !otp) {
              console.log("[AUTH] Missing email or otp");
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
              let user = await User.findOne({ email });
              if (!user) {
                  user = await User.create({ email, name: `User ${email.split('@')[0]}`, role: "customer" });
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

          console.log(`[AUTH] Checking OTP for email: ${email}, OTP: ${otp}`);
          
          let isValid = false;

          const latestOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
          console.log(`[AUTH] Latest OTP record in DB:`, latestOtp);

          if (latestOtp && latestOtp.code === otp) {
              isValid = true;
          }

          if (!isValid) {
              console.log("[AUTH] Invalid OTP");
              return null;
          }

          // Cleanup
          await OTP.deleteMany({ email });

          let user = await User.findOne({ email });
          if (!user) {
              user = await User.create({ email, name: `User ${email.split('@')[0]}`, role: "customer" });
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
          console.error("[AUTH] Email login error:", e.message || e);
          return null;
        }
      }
    })
  ]
});
