import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  groupId: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

// Paid in group
// Paid to person
// Got Paid by person
// Got Paid in group
// You paid in group
// You paid a person
// Updated the group
// Added expense

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
