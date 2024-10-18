"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const friend_1 = __importDefault(require("../models/friend"));
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const router = express_1.default.Router();
router.get("/", auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        const pageSize = 20;
        const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
        const friends = yield friend_1.default.find({ userId: id })
            .skip(pageNumber)
            .limit(pageSize);
        const total = yield friend_1.default.countDocuments();
        let finalData = [];
        for (let item of friends) {
            let user = undefined;
            if (item.friendId) {
                user = yield user_1.default.findOne({ _id: item.friendId });
            }
            finalData.push({
                _id: item._id.toString(),
                userId: item.userId,
                friendId: item.friendId,
                balance: item.balance,
                name: item === null || item === void 0 ? void 0 : item.name,
                mobileNumber: item === null || item === void 0 ? void 0 : item.mobileNumber,
                profilePic: (user === null || user === void 0 ? void 0 : user.profilePic) || "",
            });
        }
        res.json({
            data: finalData,
            pagination: { page: pageNumber, pageSize: pageSize, total: total },
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.post("/addFriend", auth_1.verifyToken, [
    (0, express_validator_1.check)("userId", "User id is required").isNumeric(),
    (0, express_validator_1.check)("balance", "Balance is required").isNumeric(),
    (0, express_validator_1.check)("name", "Name is required").isString(),
    (0, express_validator_1.check)("mobileNumber", "Mobile number is required").isString(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name, mobileNumber } = req.body;
        if (!userId) {
            return res
                .status(400)
                .json({ message: "User id and friend id are required" });
        }
        let tempFriend = yield friend_1.default.findOne({
            userId: userId,
            mobileNumber: mobileNumber,
        });
        if (tempFriend) {
            return res.status(400).json({ message: "Friend already exists" });
        }
        let friendId = "";
        const user = yield user_1.default.findOne({ mobile: mobileNumber });
        if (user) {
            friendId = user._id.toString();
        }
        const friend = new friend_1.default({
            userId: userId,
            friendId: friendId,
            name: name,
            mobileNumber: mobileNumber,
            balance: 0,
        });
        yield friend.save();
        res.json({ message: "Friend added successfully", data: friend });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.post("/deleteFriend", auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, mobile } = req.body;
        if (!userId) {
            return res
                .status(400)
                .json({ message: "User id and friend id are required" });
        }
        yield friend_1.default.deleteOne({ userId: userId, mobileNumber: mobile });
        res.json({ message: "Friend deleted successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.default = router;
