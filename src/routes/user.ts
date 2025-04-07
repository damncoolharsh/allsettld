import express from "express";
import { check } from "express-validator";
import multer from "multer";
import { verifyToken } from "../middleware/auth";
import { UserController } from "../controller/user";

const router = express.Router();
const userController = new UserController();
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
  userController.register
);

router.post("/sendOtp", userController.sendOtp);

router.post("/verifyOtp", userController.verifyOtp);

router.post(
  "/updateUser",
  upload.single("profilePic"),
  verifyToken,
  [check("_id", "Id is required").isString()],
  userController.updateUser
);

router.get("/getUserData", verifyToken, userController.getUserData);

router.get("/summary", verifyToken, userController.getUserSummary);

export default router;
