import mongoose, { Schema, model, models } from 'mongoose';

const OTPSchema = new Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // Expires in 5 minutes (300 seconds)
}, { timestamps: true });

const OTP = models.OTP || model('OTP', OTPSchema);

export default OTP;
