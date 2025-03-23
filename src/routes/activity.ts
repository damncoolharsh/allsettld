import express, { Request, Response } from "express";
import { ActivityController } from "../controller/activity";

const router = express.Router();
const activityController = new ActivityController();

router.get("/", activityController.getActivity);

export default router;
