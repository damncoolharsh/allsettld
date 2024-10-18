import mongoose from "mongoose";

export type TransactionType = {
  _id: string;
  type: "debit" | "credit" | "settle";
  amount: number;
  description: string;
  date: Date;
  groupId: string;
};

const transactionSchema = new mongoose.Schema<TransactionType>({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model<TransactionType>(
  "Transaction",
  transactionSchema
);
export default Transaction;
