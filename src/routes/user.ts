import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import multer from "multer";
import User from "../models/user";
import { generateOTP, sendSms, uploadImages } from "../utils/helper";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth";
import Friend from "../models/friend";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/register",
  upload.single("profilePic"),
  [
    check("name", "Name is required").isString(),
    check("mobile", "Invalid Mobile").isMobilePhone("en-IN"),
    check("password", "Password must be of minimum 6 length").isLength({
      min: 6,
    }),
    check("email", "Invalid Email").isEmail(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { mobile } = req.body;
      let user = await User.findOne({ mobile: mobile });
      if (user) {
        res.status(400).json({ message: "User already exists" });
      }

      const imageFile = req.file as Express.Multer.File;
      if (imageFile) {
        const profilePics = await uploadImages([imageFile]);
        req.body.profilePic = profilePics[0];
      }

      user = new User(req.body);
      await user.save();
      const friendsData = await Friend.find({ mobileNumber: user.mobile });

      if (friendsData.length > 0) {
        for (let i = 0; i < friendsData.length; i++) {
          const friend = friendsData[i];
          friend.friendId = user._id.toString();
          await friend.save();
        }
      }
      res.json({ message: "User registered successfully", data: user });
    } catch (err) {
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

router.post("/sendOtp", async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    let user = await User.findOne({ mobile: mobile });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
      // Register user
      // if (req.body.isAdmin) delete req.body.isAdmin;
      // const imageFile = req.file as Express.Multer.File;
      // if (imageFile) {
      //   const profilePics = await uploadImages([imageFile]);
      //   req.body.profilePic = profilePics[0];
      // }
      // user = new User(req.body);
      // await user.save();
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
});

router.post("/verifyOtp", async (req: Request, res: Response) => {
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
});

router.post(
  "/updateUser",
  upload.single("profilePic"),
  verifyToken,
  [check("_id", "Id is required").isString()],
  async (req: Request, res: Response) => {
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
);

router.post(
  "/getUserData",
  verifyToken,
  async (req: Request, res: Response) => {
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
);

export default router;
