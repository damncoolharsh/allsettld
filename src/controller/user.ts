import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import multer from "multer";
import User from "../models/user";
import { generateOTP, sendSms, uploadImages } from "../utils/helper";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth";
import Friend from "../models/friend";
import GroupMember from "../models/groupMember";
import Balance from "../models/balance";
import ExpenseSplit from "../models/expenseSplit";

export class UserController {
  async register(req: Request, res: Response) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { mobile } = req.body;
      let user = await User.findOne({ mobile: mobile });
      if (user) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const imageFile = req.file as Express.Multer.File;
      if (imageFile) {
        const profilePics = await uploadImages([imageFile]);
        req.body.profilePic = profilePics[0];
      }

      user = new User(req.body);
      await user.save();
      const friendsData = await Friend.find({ friend_mobile: user.mobile });
      if (friendsData.length > 0) {
        for (let i = 0; i < friendsData.length; i++) {
          const friend = friendsData[i];
          friend.friend_id = user._id;
          await friend.save();
        }
      }
      const groupMember = await GroupMember.find({ mobile: user.mobile });
      if (groupMember.length > 0) {
        for (let i = 0; i < groupMember.length; i++) {
          const group = groupMember[i];
          group.member_id = user._id;
          await group.save();
        }
      }
      const balances = await Balance.find({ payee_mobile: user.mobile });
      if (balances.length > 0) {
        for (let i = 0; i < balances.length; i++) {
          const balance = balances[i];
          if (!balance.payer_id) {
            balance.payer_id = user._id.toString();
          }
          if (!balance.payee_id) {
            balance.payee_id = user._id.toString();
          }
          await balance.save();
        }
      }
      const expenseSplit = await ExpenseSplit.find({
        user_mobile: user.mobile,
      });
      if (expenseSplit.length > 0) {
        for (let i = 0; i < expenseSplit.length; i++) {
          const expense = expenseSplit[i];
          expense.user_id = user._id;
          await expense.save();
        }
      }
      res.json({ message: "User registered successfully", data: user });
    } catch (err) {
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async sendOtp(req: Request, res: Response) {
    try {
      const { mobile } = req.body;
      let user = await User.findOne({ mobile: mobile });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const otp = generateOTP(6);
      user.phoneOtp = otp;
      await user.save();
      sendSms("91" + mobile, `#allsettld, Your OTP is ${otp}`);
      res.json({ message: "OTP sent successfully" });
    } catch (err) {
      console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { mobile, otp } = req.body;
      let user = await User.findOne({ mobile: mobile });
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }
      if (user.phoneOtp !== otp) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      }
      user.phoneOtp = "";
      await user.save();
      const token = jwt.sign({ user }, process.env.JWT_SECRET as string, {
        expiresIn: "24h",
      });
      res.json({ token, message: "OTP verified successfully" });
    } catch (err) {
      console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await User.findOne({ _id: req.body._id });
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }
      if (req.body.name) user.name = req.body.name;
      const imageFile = req.file as Express.Multer.File;
      if (imageFile) {
        const profilePics = await uploadImages([imageFile]);
        user.profilePic = profilePics[0];
      }
      await user.save();
      res.json({ message: "User updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async getUserData(req: Request, res: Response) {
    try {
      const id = req.query?.id;

      if (!id) {
        return res.status(400).json({ message: "User id is required" });
      }

      const user = await User.findOne({ _id: id });
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }
      res.json({ data: user });
    } catch (err) {
      console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async getUserSummary(req: Request, res: Response) {
    try {
      const userId = req.query.id; // Assuming verifyToken middleware adds userId to req

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find all balances where the user is either the payer or the payee
      const userBalances = await Balance.find({
        $or: [{ payer_id: userId }, { payee_id: userId }],
      });

      let totalOwes = 0; // Amount user needs to pay others
      let totalOwed = 0; // Amount others need to pay user

      console.log(
        "🚀 ~ UserController ~ userBalances.forEach ~ userBalances:",
        userBalances
      );
      userBalances.forEach((balance) => {
        if (balance.payer_id.toString() === userId.toString()) {
          // User is the payer
          if (balance.amount > 0) {
            // Payer owes payee (user owes)
            totalOwes += balance.amount;
          } else {
            // Payee owes payer (user is owed) - amount is negative
            totalOwed += Math.abs(balance.amount);
          }
        } else {
          // User is the payee
          if (balance.amount > 0) {
            // Payer owes payee (user is owed)
            totalOwed += balance.amount;
          } else {
            // Payee owes payer (user owes) - amount is negative
            totalOwes += Math.abs(balance.amount);
          }
        }
      });

      res.json({
        data: {
          totalOwes: totalOwes,
          totalOwed: totalOwed,
        },
      });
    } catch (err) {
      console.error("Error fetching user summary:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
}
