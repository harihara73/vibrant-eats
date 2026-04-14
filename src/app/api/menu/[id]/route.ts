import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    await connectDB();
    const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        data,
        { new: true }
    );
    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

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
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    await connectDB();
    const result = await MenuItem.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE API Error:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
