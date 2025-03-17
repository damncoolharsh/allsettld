import mongoose from "mongoose";

export type GroupType = {
  _id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: Date;
  updatedAt: Date;
  image?: string;
};

const groupSchema = new mongoose.Schema<GroupType>({
  name: { type: String, required: true },
  description: { type: String },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  image: { type: String },
});

const Group = mongoose.model<GroupType>("Group", groupSchema);
export default Group;
