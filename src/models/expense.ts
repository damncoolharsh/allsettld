import mongoose from "mongoose";

type ExpenseType = {
  members: MemberType[];
  amount: number;
  _id: string;
  groupId: string;
  date: Date;
};

export type MemberType = {
  id: string;
  balance: string;
};

const expenseSchema = new mongoose.Schema<ExpenseType>({
  members: [
    {
      id: { type: String, required: true },
      balance: { type: String, required: true },
    },
  ],
  amount: { type: Number, required: true },
  groupId: { type: String, required: true },
});

const Expense = mongoose.model<ExpenseType>("Expense", expenseSchema);
export default Expense;
