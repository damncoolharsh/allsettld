import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthController {
  async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email: email }).select("+password");
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

      return res.status(200).json({ userID: user._id, token });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  async register(req: Request, res: Response) {
    res.send("Register");
  }

  async validateToken(req: Request, res: Response) {
    res.status(200).send({ userId: req.userId });
  }

  async logout(req: Request, res: Response) {
    res.cookie("auth_token", "", {
      expires: new Date(0),
    });
    res.send();
  }
}
