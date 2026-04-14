import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

const DEFAULT_DELIVERY_CHARGES = { '5': 15, '10': 25, '15': 35, '20': 50 };

function withDefaults(doc: any) {
  const plain = doc.toObject ? doc.toObject({ getters: false, virtuals: false }) : { ...doc };

  if (plain.restaurantLat == null)    plain.restaurantLat    = 17.4348;
  if (plain.restaurantLng == null)    plain.restaurantLng    = 82.2270;
  if (plain.restaurantName == null)   plain.restaurantName   = 'VibrantEats Restaurant';
  if (plain.deliveryRadiusKm == null) plain.deliveryRadiusKm = 5;
  if (plain.deliveryDiscount == null) plain.deliveryDiscount = 0;

  // Handle deliveryCharges
  if (!plain.deliveryCharges || typeof plain.deliveryCharges !== 'object') {
    plain.deliveryCharges = DEFAULT_DELIVERY_CHARGES;
  }

  if (plain.categories == null) {
    plain.categories = ["Soups and Salads", "Appetizers / Starters", "Main Course / Entrées", "Sides / Accompaniments", "Desserts", "Beverages"];
  }

  if (plain.dietaryTypes == null) {
    plain.dietaryTypes = ["Veg", "Non-Veg"];
  }

  return plain;
}

// GET current settings - Public
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'main_settings', isLive: true });
    }
    const result = withDefaults(settings);
    return Response.json(result);
  } catch (error: any) {
    console.error('[Settings GET] Error:', error.message);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH update settings - Admin only
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await connectDB();

    const updateFields: Record<string, any> = {};
    if (body.isLive !== undefined)           updateFields.isLive           = body.isLive;
    if (body.shutdownMessage !== undefined)  updateFields.shutdownMessage  = body.shutdownMessage;
    if (body.restaurantLat !== undefined)    updateFields.restaurantLat    = Number(body.restaurantLat);
    if (body.restaurantLng !== undefined)    updateFields.restaurantLng    = Number(body.restaurantLng);
    if (body.restaurantName !== undefined)   updateFields.restaurantName   = body.restaurantName;
    if (body.deliveryRadiusKm !== undefined) updateFields.deliveryRadiusKm = Number(body.deliveryRadiusKm);
    if (body.deliveryDiscount !== undefined) updateFields.deliveryDiscount = Number(body.deliveryDiscount);
    if (body.deliveryCharges !== undefined)  updateFields.deliveryCharges  = body.deliveryCharges;
    if (body.categories !== undefined)       updateFields.categories       = body.categories;
    if (body.dietaryTypes !== undefined)     updateFields.dietaryTypes     = body.dietaryTypes;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main_settings' },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    const result = withDefaults(settings);
    return Response.json(result);
  } catch (error: any) {
    console.error('[Settings PATCH] Error:', error.message);
    return Response.json({ error: "Failed to update settings: " + error.message }, { status: 500 });
  }
}
