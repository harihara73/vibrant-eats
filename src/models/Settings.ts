import { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema({
  key: { type: String, default: 'main_settings', unique: true },
  isLive: { type: Boolean, default: true },
  shutdownMessage: { type: String, default: 'Restaurant Shutdown, come again' },
  // Restaurant location
  restaurantLat:  { type: Number, default: 17.4348 },
  restaurantLng:  { type: Number, default: 82.2270 },
  restaurantName: { type: String, default: 'VibrantEats Restaurant' },
  // Delivery radius tiers
  deliveryRadiusKm: { type: Number, default: 5 },
  // Per-tier charges
  deliveryCharges: {
    type: Object,
    default: { '5': 15, '10': 25, '15': 35, '20': 50 }
  },
  // Discount % on delivery charge
  deliveryDiscount: { type: Number, default: 0 },
  // Menu metadata
  categories: { 
    type: [String], 
    default: ["Soups and Salads", "Appetizers / Starters", "Main Course / Entrées", "Sides / Accompaniments", "Desserts", "Beverages"] 
  },
  dietaryTypes: {
    type: [String],
    default: ["Veg", "Non-Veg"]
  }
}, { timestamps: true, strict: false });

const Settings = models.Settings || model('Settings', SettingsSchema);

export default Settings;
