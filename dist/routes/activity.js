"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activity_1 = require("../controller/activity");
const router = express_1.default.Router();
const activityController = new activity_1.ActivityController();
router.get("/", activityController.getActivity);
exports.default = router;
