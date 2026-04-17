import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, sparse: true },
  email: { type: String, unique: true, sparse: true },
  addresses: [{ 
    doorNo: { type: String },
    addressLine: { type: String },
    area: { type: String },
    landmark: { type: String },
    pincode: { type: String },
    text: { type: String }, // Summary field
    lat: { type: Number },
    lng: { type: Number }
  }],
  password: { type: String },
  role: { type: String, enum: ['admin', 'customer', 'delivery'], default: 'customer' },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
