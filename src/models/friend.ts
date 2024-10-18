import mongoose from "mongoose";

type Friend = {
  _id: string;
  name: string;
  mobileNumber: string;
  profilePic?: string;
  balance: number;
  userId: string;
  friendId?: string;
};

const friendSchema = new mongoose.Schema<Friend>({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  profilePic: { type: String },
  balance: { type: Number, default: 0 },
  userId: { type: String, required: true },
  friendId: { type: String },
});

const Friend = mongoose.model<Friend>("Friend", friendSchema);
export default Friend;
