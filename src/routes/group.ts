import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import { check, validationResult } from "express-validator";
import { GroupController } from "../controller/group";
import upload from "../utils/upload";
import Group from "../models/group";

const router = express.Router();
const groupController = new GroupController();

router.get("/", verifyToken, groupController.getGroups);
router.get("/members", verifyToken, groupController.getGroupMembers);

router.post(
  "/createGroup",
  verifyToken,
  upload.single("image"),
  [
    check("name", "Group name is required").not().isEmpty(),
    check("userId", "User id is required").isString(),
    check("description", "Description is required").isString(),
  ],
  groupController.createGroup
);

router.post(
  "/updateGroup",
  verifyToken,
  upload.single("image"),
  [check("groupId", "Group Id is required").not().isEmpty()],
  groupController.updateGroup
);

router.post(
  "/addMember",
  verifyToken,
  [
    check("groupId", "Group Id is required").not().isEmpty(),
    check("userId", "User Id is required").not().isEmpty(),
  ],
  groupController.addMember
);

router.post(
  "/bulkAddMember",
  verifyToken,
  [
    check("groupId", "Group Id is required").not().isEmpty(),
    check("members", "Members is required").not().isEmpty(),
  ],
  groupController.bulkAddMember
);

router.post(
  "/removeMember",
  verifyToken,
  [
    check("groupId", "Group Id is required").not().isEmpty(),
    check("userId", "User Id is required").not().isEmpty(),
  ],
  groupController.removeMember
);

export default router;
