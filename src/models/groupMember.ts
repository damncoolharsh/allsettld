import mongoose from "mongoose";

export type GroupMemberType = {
  group_id: mongoose.Types.ObjectId;
  member_id?: mongoose.Types.ObjectId;
  mobile?: string;
  name?: string;
  joined_at: Date;
};

const groupMemeberSchema = new mongoose.Schema<GroupMemberType>({
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  mobile: { type: String },
  name: { type: String },
  joined_at: { type: Date, default: Date.now },
});

const GroupMember = mongoose.model<GroupMemberType>(
  "GroupMember",
  groupMemeberSchema
);
export default GroupMember;
