import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();
    
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userToDelete.role !== 'delivery') {
      return NextResponse.json({ error: "Can only delete delivery boys" }, { status: 403 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Team member removed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";
  
  if (!session || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, email, password } = await req.json();
    
    await connectDB();
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      updateData.email = email;
    }
    
    if (password) {
      const { default: bcrypt } = await import("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
