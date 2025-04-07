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
exports.UserController = void 0;
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const helper_1 = require("../utils/helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const friend_1 = __importDefault(require("../models/friend"));
const groupMember_1 = __importDefault(require("../models/groupMember"));
const balance_1 = __importDefault(require("../models/balance"));
const expenseSplit_1 = __importDefault(require("../models/expenseSplit"));
class UserController {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { mobile } = req.body;
                let user = yield user_1.default.findOne({ mobile: mobile });
                if (user) {
                    res.status(400).json({ message: "User already exists" });
                    return;
                }
                const imageFile = req.file;
                if (imageFile) {
                    const profilePics = yield (0, helper_1.uploadImages)([imageFile]);
                    req.body.profilePic = profilePics[0];
                }
                user = new user_1.default(req.body);
                yield user.save();
                const friendsData = yield friend_1.default.find({ friend_mobile: user.mobile });
                if (friendsData.length > 0) {
                    for (let i = 0; i < friendsData.length; i++) {
                        const friend = friendsData[i];
                        friend.friend_id = user._id;
                        yield friend.save();
                    }
                }
                const groupMember = yield groupMember_1.default.find({ mobile: user.mobile });
                if (groupMember.length > 0) {
                    for (let i = 0; i < groupMember.length; i++) {
                        const group = groupMember[i];
                        group.member_id = user._id;
                        yield group.save();
                    }
                }
                const balances = yield balance_1.default.find({ payee_mobile: user.mobile });
                if (balances.length > 0) {
                    for (let i = 0; i < balances.length; i++) {
                        const balance = balances[i];
                        if (!balance.payer_id) {
                            balance.payer_id = user._id.toString();
                        }
                        if (!balance.payee_id) {
                            balance.payee_id = user._id.toString();
                        }
                        yield balance.save();
                    }
                }
                const expenseSplit = yield expenseSplit_1.default.find({
                    user_mobile: user.mobile,
                });
                if (expenseSplit.length > 0) {
                    for (let i = 0; i < expenseSplit.length; i++) {
                        const expense = expenseSplit[i];
                        expense.user_id = user._id;
                        yield expense.save();
                    }
                }
                res.json({ message: "User registered successfully", data: user });
            }
            catch (err) {
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    sendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mobile } = req.body;
                let user = yield user_1.default.findOne({ mobile: mobile });
                if (!user) {
                    return res.status(400).json({ message: "User not found" });
                }
                const otp = (0, helper_1.generateOTP)(6);
                user.phoneOtp = otp;
                yield user.save();
                (0, helper_1.sendSms)("91" + mobile, `#allsettld, Your OTP is ${otp}`);
                res.json({ message: "OTP sent successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    verifyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mobile, otp } = req.body;
                let user = yield user_1.default.findOne({ mobile: mobile });
                if (!user) {
                    res.status(400).json({ message: "User not found" });
                    return;
                }
                if (user.phoneOtp !== otp) {
                    res.status(400).json({ message: "Invalid OTP" });
                    return;
                }
                user.phoneOtp = "";
                yield user.save();
                const token = jsonwebtoken_1.default.sign({ user }, process.env.JWT_SECRET, {
                    expiresIn: "24h",
                });
                res.json({ token, message: "OTP verified successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield user_1.default.findOne({ _id: req.body._id });
                if (!user) {
                    res.status(400).json({ message: "User not found" });
                    return;
                }
                if (req.body.name)
                    user.name = req.body.name;
                const imageFile = req.file;
                if (imageFile) {
                    const profilePics = yield (0, helper_1.uploadImages)([imageFile]);
                    user.profilePic = profilePics[0];
                }
                yield user.save();
                res.json({ message: "User updated successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    getUserData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
                if (!id) {
                    return res.status(400).json({ message: "User id is required" });
                }
                const user = yield user_1.default.findOne({ _id: id });
                if (!user) {
                    res.status(400).json({ message: "User not found" });
                    return;
                }
                res.json({ data: user });
            }
            catch (err) {
                console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    getUserSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.query.id; // Assuming verifyToken middleware adds userId to req
                if (!userId) {
                    return res.status(401).json({ message: "User not authenticated" });
                }
                // Find all balances where the user is either the payer or the payee
                const userBalances = yield balance_1.default.find({
                    $or: [{ payer_id: userId }, { payee_id: userId }],
                });
                let totalOwes = 0; // Amount user needs to pay others
                let totalOwed = 0; // Amount others need to pay user
                console.log("🚀 ~ UserController ~ userBalances.forEach ~ userBalances:", userBalances);
                userBalances.forEach((balance) => {
                    if (balance.payer_id.toString() === userId.toString()) {
                        // User is the payer
                        if (balance.amount > 0) {
                            // Payer owes payee (user owes)
                            totalOwes += balance.amount;
                        }
                        else {
                            // Payee owes payer (user is owed) - amount is negative
                            totalOwed += Math.abs(balance.amount);
                        }
                    }
                    else {
                        // User is the payee
                        if (balance.amount > 0) {
                            // Payer owes payee (user is owed)
                            totalOwed += balance.amount;
                        }
                        else {
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
            }
            catch (err) {
                console.error("Error fetching user summary:", err);
                res.status(500).json({ message: "Something went wrong" });
            }
        });
    }
}
exports.UserController = UserController;
