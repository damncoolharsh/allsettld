import mongoose from "mongoose";

export type ExpenseSplitType = {
  user_id: mongoose.Types.ObjectId;
  user_mobile: string;
  user_name: string;
  expense_id: string;
  amount: number;
};

const expenseSplitSchema = new mongoose.Schema<ExpenseSplitType>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  user_mobile: { type: String },
  user_name: { type: String },
  expense_id: { type: String, required: true },
  amount: { type: Number, required: true },
});

const ExpenseSplit = mongoose.model<ExpenseSplitType>(
  "ExpenseSplit",
  expenseSplitSchema
);
export default ExpenseSplit;
