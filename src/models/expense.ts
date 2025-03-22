import mongoose from "mongoose";
import { ExpenseSplitType } from "./expenseSplit";

export type ExpenseType = {
  group_id: string;
  description?: string;
  amount: number;
  paid_by: mongoose.Types.ObjectId;
  created_at: Date;
  split?: ExpenseSplitType[];
};

const expenseSchema = new mongoose.Schema<ExpenseType>({
  group_id: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: { type: Date, default: Date.now },
});

const Expense = mongoose.model<ExpenseType>("Expense", expenseSchema);
export default Expense;
