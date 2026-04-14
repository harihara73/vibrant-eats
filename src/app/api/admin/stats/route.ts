import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // 1. Basic Stats
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const activeOrdersCount = await Order.countDocuments({ 
      status: { $in: ["pending", "accepted", "preparing", "out-for-delivery"] } 
    });

    const totalCustomersCount = await User.countDocuments({ role: "customer" });

    // 2. Recent Orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. Revenue over last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const revenueData = await Order.aggregate([
      { 
        $match: { 
          status: "delivered",
          createdAt: { $gte: last7Days }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format revenue data for charts (ensure all days are represented if possible)
    // For now, just return what MongoDB provides
    const formattedRevenue = revenueData.map(item => ({
      date: item._id,
      amount: item.revenue
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: `₹${totalRevenue.toLocaleString()}`,
        activeOrders: activeOrdersCount.toString(),
        totalCustomers: totalCustomersCount.toString(),
        dailyGrowth: "+0%" // Static for now, can be calculated by comparing with yesterday
      },
      recentOrders,
      revenueData: formattedRevenue
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
