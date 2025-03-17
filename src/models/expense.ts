import mongoose from "mongoose";

export type ExpenseType = {
  group_id: string;
  description?: string;
  amount: number;
  paid_by: string;
  created_at: Date;
};

const expenseSchema = new mongoose.Schema<ExpenseType>({
  group_id: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  paid_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Expense = mongoose.model<ExpenseType>("Expense", expenseSchema);
export default Expense;
