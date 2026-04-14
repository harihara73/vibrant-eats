import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Fetch orders linked to this customer ID
    // We also sort by createdAt: -1 to show newest first
    const orders = await Order.find({ 
      customerId: (session.user as any).id 
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Fetch Customer Orders Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
