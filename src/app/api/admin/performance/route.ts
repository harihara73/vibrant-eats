import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // Expected: YYYY-MM-DD
    
    await connectDB();
 
    let startDate: Date;
    let endDate: Date;
 
    if (dateStr) {
      startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }
 
    // Fetch all delivered orders within range
    const reports = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          deliveredAt: { $gte: startDate, $lte: endDate },
          deliveryBoyId: { $exists: true }
        }
      },
      {
        $group: {
          _id: "$deliveryBoyId",
          name: { $first: "$deliveryBoyName" },
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: "$total" },
          lastDelivery: { $max: "$deliveredAt" }
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}
