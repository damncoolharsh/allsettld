import express, { Request, Response } from "express";
import { body, check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const router = express.Router();

router.post(
  "/login",
  [
    check("email", "Invalid Email").isEmail(),
    check("password", "Password must be of minimum 6 length").isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "1d",
        }
      );

      console.log("🚀 ~ user:", user);
      return res.status(200).json({ userID: user._id, token });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
    console.log("🚀 ~ process.env.JWT_SECRET:", process.env.JWT_SECRET);
  }
);

router.post("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({ userId: req.userId });
});

router.post("/logout", (req, res) => {
  res.cookie("auth_token", "", {
    expires: new Date(0),
  });
  res.send();
});

export default router;
