"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const friend_1 = require("../controller/friend");
const router = express_1.default.Router();
const friendController = new friend_1.FriendController();
router.get("/", auth_1.verifyToken, friendController.getFriends);
router.post("/addFriend", auth_1.verifyToken, [
    (0, express_validator_1.check)("userId", "User id is required").isNumeric(),
    (0, express_validator_1.check)("balance", "Balance is required").isNumeric(),
    (0, express_validator_1.check)("name", "Name is required").isString(),
    (0, express_validator_1.check)("mobileNumber", "Mobile number is required").isString(),
], friendController.addFriend);
router.post("/deleteFriend", auth_1.verifyToken, friendController.deleteFriend);
exports.default = router;
