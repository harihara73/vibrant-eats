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

  // Handle deliveryCharges - now stored as plain Object
  if (!plain.deliveryCharges || typeof plain.deliveryCharges !== 'object') {
    plain.deliveryCharges = DEFAULT_DELIVERY_CHARGES;
  } else if (plain.deliveryCharges instanceof Map) {
    // Legacy cleanup if somehow still a Map
    const obj: Record<string, number> = {};
    plain.deliveryCharges.forEach((v: number, k: string) => { obj[k] = v; });
    plain.deliveryCharges = obj;
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
    console.log(`[Settings GET] restaurantLat=${result.restaurantLat}, restaurantLng=${result.restaurantLng}, radius=${result.deliveryRadiusKm}km`);
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
    console.warn('[Settings PATCH] Unauthorized attempt');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log(`[Settings PATCH] Saving:`, JSON.stringify(body));

    await connectDB();

    // Use $set with explicit field mapping to avoid Mongoose strict-mode issues
    const updateFields: Record<string, any> = {};
    if (body.isLive !== undefined)           updateFields.isLive           = body.isLive;
    if (body.shutdownMessage !== undefined)  updateFields.shutdownMessage  = body.shutdownMessage;
    if (body.restaurantLat !== undefined)    updateFields.restaurantLat    = Number(body.restaurantLat);
    if (body.restaurantLng !== undefined)    updateFields.restaurantLng    = Number(body.restaurantLng);
    if (body.restaurantName !== undefined)   updateFields.restaurantName   = body.restaurantName;
    if (body.deliveryRadiusKm !== undefined) updateFields.deliveryRadiusKm = Number(body.deliveryRadiusKm);
    if (body.deliveryDiscount !== undefined) updateFields.deliveryDiscount = Number(body.deliveryDiscount);
    if (body.deliveryCharges !== undefined)  updateFields.deliveryCharges  = body.deliveryCharges;

    console.log(`[Settings PATCH] Update fields:`, JSON.stringify(updateFields));

    const settings = await Settings.findOneAndUpdate(
      { key: 'main_settings' },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    const result = withDefaults(settings);
    console.log(`[Settings PATCH] Saved OK. restaurantLat=${result.restaurantLat}, restaurantLng=${result.restaurantLng}`);
    return Response.json(result);
  } catch (error: any) {
    console.error('[Settings PATCH] Error:', error.message);
    return Response.json({ error: "Failed to update settings: " + error.message }, { status: 500 });
  }
}
