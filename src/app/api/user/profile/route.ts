import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, phone, address, addresses } = await req.json();
    await connectDB();

    // Only update name, phone, and addresses. Do not allow updating email here to avoid unique constraint issues.
    const updateData: any = { name, phone };
    if (addresses) updateData.addresses = addresses;
    else if (address) updateData.addresses = [address];

    const updatedUser = await User.findByIdAndUpdate(
      (session.user as any).id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses
      }
    });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    
    // Handle MongoDB Duplicate Key Error (Code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({ 
        error: `This ${field} is already linked to another account.` 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
