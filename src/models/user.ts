import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type UserType = {
  email: string;
  mobile: string;
  password: string;
  name: string;
  profilePic: string;
  phoneOtp: string;
};

const userSchema = new mongoose.Schema<UserType>({
  email: { type: String, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  name: { type: String },
  profilePic: { type: String },
  phoneOtp: { type: String },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model<UserType>("User", userSchema);

export default User;
