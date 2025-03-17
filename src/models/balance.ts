import mongoose from "mongoose";

interface Balance {
  payer_id: string;
  payee_id: string;
  payee_mobile: string;
  payer_mobile: string;
  amount: number;
  updated_at: Date;
  group_id: string;
}

const balanceSchema = new mongoose.Schema<Balance>({
  payer_id: { type: String },
  payee_id: { type: String },
  payee_mobile: { type: String },
  payer_mobile: { type: String },
  amount: { type: Number, required: true },
  updated_at: { type: Date, default: Date.now },
  group_id: { type: String },
});

const Balance = mongoose.model<Balance>("Balance", balanceSchema);
export default Balance;
