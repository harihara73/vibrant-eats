import { Schema, model, models } from 'mongoose';

const OrderItemSchema = new Schema({
  menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  extraPhone: { type: String },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'preparing', 'ready-to-pickup', 'out-for-delivery', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { type: String, default: 'pending' },
  paymentMethod: { type: String, default: 'COD' },
  cancellationReason: { type: String },
  acceptedAt: { type: Date },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  outForDeliveryAt: { type: Date },
  deliveredAt: { type: Date },
  deliveryBoyId: { type: Schema.Types.ObjectId, ref: 'User' },
  deliveryBoyName: { type: String },
  deliveryCode: { type: String },
}, { timestamps: true });

const Order = models.Order || model('Order', OrderSchema);

export default Order;
