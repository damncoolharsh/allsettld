import mongoose from "mongoose";

export type GroupType = {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: string[];
};

const groupSchema = new mongoose.Schema<GroupType>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  members: { type: [String], required: true },
});

const Group = mongoose.model<GroupType>("Group", groupSchema);
export default Group;
