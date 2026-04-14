import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const user = session?.user as any;

  if (!session || user.role !== "delivery") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    // 1. Get Today's Stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayStats = await Order.aggregate([
      {
        $match: {
          deliveryBoyId: userId,
          status: 'delivered',
          deliveredAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: "$total" }
        }
      }
    ]);

    // 2. Get Recent Deliveries (last 20)
    const recentDeliveries = await Order.find({
      deliveryBoyId: userId,
      status: 'delivered'
    })
    .sort({ deliveredAt: -1 })
    .limit(20)
    .lean();

    return NextResponse.json({
      today: todayStats[0] || { totalOrders: 0, totalEarnings: 0 },
      history: recentDeliveries
    });

  } catch (error: any) {
    console.error("Delivery Performance API Error:", error);
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}
