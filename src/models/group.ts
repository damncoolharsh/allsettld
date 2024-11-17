import mongoose from "mongoose";

export type GroupType = {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: mongoose.Schema.Types.ObjectId[];
  image?: string;
  currentActivity: {
    memberId: mongoose.Schema.Types.ObjectId;
    amount: number;
    to: mongoose.Schema.Types.ObjectId;
  }[];
};

const groupSchema = new mongoose.Schema<GroupType>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  image: { type: String },
  currentActivity: [
    {
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      amount: { type: Number, required: true },
      to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
  ],
});

const Group = mongoose.model<GroupType>("Group", groupSchema);
export default Group;
