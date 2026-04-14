import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["admin", "delivery"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Ensure dependent models are registered for Mongoose population (prevents tree-shaking and "Schema hasn't been registered" errors)
    console.debug(MenuItem.modelName, User.modelName);

    const orders = await Order.find({ 
      status: { $in: ["pending", "accepted", "preparing", "ready-to-pickup", "out-for-delivery"] } 
    }).sort({ createdAt: -1 })
    .populate('items.menuItem')
    .lean();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Public route for customers to place orders
  try {
    const data = await req.json();
    await connectDB();
    const newOrder = await Order.create(data);
    return NextResponse.json(newOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
