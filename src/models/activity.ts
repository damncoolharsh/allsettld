import mongoose from "mongoose";
import { ExpenseSplitType } from "./expenseSplit";

interface Activity {
  _id: string;
  groupId: mongoose.Types.ObjectId; // null for non-group activities
  userId: mongoose.Types.ObjectId; // User who performed the action
  activityType: ActivityType;
  details: ActivityDetails;
  timestamp: Date;
}

export enum ActivityType {
  GROUP_CREATED = "GROUP_CREATED",
  MEMBER_ADDED = "MEMBER_ADDED",
  MULTI_MEMBER_ADDED = "MULTI_MEMBER_ADDED",
  MEMBER_REMOVED = "MEMBER_REMOVED",
  EXPENSE_ADDED = "EXPENSE_ADDED",
  EXPENSE_EDITED = "EXPENSE_EDITED",
  EXPENSE_DELETED = "EXPENSE_DELETED",
  SETTLEMENT_PAID = "SETTLEMENT_PAID",
  GROUP_SETTLED = "GROUP_SETTLED",
}

type ActivityDetails = {
  groupName?: string;
  memberName?: string;
  members?: string[];
  expenseAmount?: number;
  expenseDescription?: string;
  settlementAmount?: number;
  expenseSplit?: ExpenseSplitType[];
  paidBy?: string;
  paidTo?: string;
};

const activitySchema = new mongoose.Schema<Activity>({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  activityType: { type: String, required: true },
  details: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Activity = mongoose.model<Activity>("Activity", activitySchema);
export default Activity;
