import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const items = await MenuItem.find({}).sort({ createdAt: -1 }).lean();
    console.log(`[${new Date().toISOString()}] Fetched items:`, items.length);
    return Response.json(items);
  } catch (error: any) {
    const isConnError = error.message.includes('ETIMEDOUT') || error.message.includes('serverSelectionTimeoutMS');
    const errorMessage = isConnError ? "Database connection timeout. Please check your IP whitelist in MongoDB Atlas." : "Failed to fetch menu items";
    
    console.error("GET Menu Error:", {
      message: error.message,
      code: error.code,
      isConnError
    });

    return Response.json({ 
      error: errorMessage, 
      details: error.message,
      code: error.code,
      items: [] // Provide empty array as fallback within the object if needed
    }, { status: isConnError ? 503 : 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    console.log("Unauthorized POST attempt to /api/menu");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    console.log("Creating menu item with data:", data);
    await connectDB();
    const newItem = await MenuItem.create(data);
    console.log("Successfully created item:", newItem._id);
    return Response.json(newItem);
  } catch (error: any) {
    console.error("POST Menu Error (FULL):", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return Response.json({ 
      error: error.message || "Failed to create menu item",
      code: error.code 
    }, { status: 500 });
  }
}
