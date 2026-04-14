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
  // Per-tier charges (stored as plain object, not Map, for easy updates)
  deliveryCharges: {
    type: Object,
    default: { '5': 15, '10': 25, '15': 35, '20': 50 }
  },
  // Discount % on delivery charge
  deliveryDiscount: { type: Number, default: 0 },
}, { timestamps: true, strict: false });

const Settings = models.Settings || model('Settings', SettingsSchema);

export default Settings;
