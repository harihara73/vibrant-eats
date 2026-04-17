import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { auth } from "@/auth";
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(id).populate('items.menuItem');
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || !["admin", "delivery"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }
    const { status, deliveryBoyId, deliveryBoyName, verificationCode } = await req.json();
    await connectDB();

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // NEW: Verification Code Check
    if (status === 'delivered') {
      if (!verificationCode) {
        return NextResponse.json({ error: "Delivery confirmation code is required to complete this order." }, { status: 400 });
      }
      
      if (existingOrder.deliveryCode && verificationCode !== existingOrder.deliveryCode) {
        return NextResponse.json({ error: "Invalid delivery confirmation code. Please ask the customer for the correct code." }, { status: 400 });
      }
    }

    // SECURITY CHECK: If delivery boy is updating, ensure they own the order
    // Exception: Admin can update anything.
    if (user.role === 'delivery') {
      // If order is already picked up, only the assigned boy can update it
      if (existingOrder.status === 'out-for-delivery' && 
          existingOrder.deliveryBoyId && 
          existingOrder.deliveryBoyId.toString() !== user.id) {
        return NextResponse.json({ error: "This order is assigned to another delivery partner." }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (deliveryBoyId !== undefined) updateData.deliveryBoyId = deliveryBoyId;
    if (deliveryBoyName !== undefined) updateData.deliveryBoyName = deliveryBoyName;
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }
    if (status === 'preparing') {
      updateData.preparingAt = new Date();
    }
    if (status === 'ready-to-pickup') {
      updateData.readyAt = new Date();
    }
    if (status === 'out-for-delivery') {
      updateData.outForDeliveryAt = new Date();
      // Record who is delivering this order
      if (user.role === 'delivery') {
        updateData.deliveryBoyId = user.id;
        updateData.deliveryBoyName = user.name || user.email.split('@')[0];
      }
    }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, strict: false }
    ).lean();
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
