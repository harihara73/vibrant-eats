import { Schema, model, models } from 'mongoose';

const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  discount: { type: Number, default: 0 },
  preparationTime: { type: Number, default: 10 },
  dietaryType: { type: String, default: 'Veg' },
}, { timestamps: true, strict: false });

const MenuItem = models.MenuItem || model('MenuItem', MenuItemSchema);

export default MenuItem;
