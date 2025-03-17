import mongoose from "mongoose";

type Friend = {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  friend_id: mongoose.Types.ObjectId;
  friend_mobile: string;
  friend_name: string;
  created_at: Date;
};

const friendSchema = new mongoose.Schema<Friend>({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  friend_id: { type: mongoose.Schema.Types.ObjectId },
  friend_mobile: { type: String, required: true },
  friend_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Friend = mongoose.model<Friend>("Friend", friendSchema);
export default Friend;
