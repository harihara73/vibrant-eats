import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!session || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const boyId = searchParams.get("id");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!boyId || !dateStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await connectDB();

    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      deliveryBoyId: new mongoose.Types.ObjectId(boyId),
      status: 'delivered',
      deliveredAt: { $gte: startDate, $lte: endDate }
    }).sort({ deliveredAt: -1 }).lean();

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Performance Details API Error:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
