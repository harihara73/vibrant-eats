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
    const { name, email, address, addresses } = await req.json();
    await connectDB();

    // Support both single address (for onboarding) and full list (for profile management)
    const updateData: any = { name, email };
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
        addresses: updatedUser.addresses
      }
    });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
