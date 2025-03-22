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
exports.FriendController = void 0;
const friend_1 = __importDefault(require("../models/friend"));
const user_1 = __importDefault(require("../models/user"));
const balance_1 = __importDefault(require("../models/balance"));
const mongodb_1 = require("mongodb");
class FriendController {
    getFriends(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
                if (!id) {
                    return res.status(400).json({ message: "User id is required" });
                }
                const pageSize = 100;
                const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
                const friendsData = yield friend_1.default.find({
                    user_id: new mongodb_1.ObjectId(id),
                })
                    .populate("friend_id")
                    .skip(pageNumber)
                    .limit(pageSize);
                const total = yield friend_1.default.find({
                    user_id: new mongodb_1.ObjectId(id),
                }).countDocuments();
                const friends = friendsData.map((val) => val.toJSON());
                for (let i = 0; i < friends.length; i++) {
                    const balance = yield balance_1.default.find({
                        $or: [
                            {
                                $and: [
                                    { payer_id: ((_b = friends[i].friend_id) === null || _b === void 0 ? void 0 : _b._id) || "NA" },
                                    { payee_id: id || "NA" },
                                ],
                            },
                            {
                                $and: [
                                    { payer_id: id || "NA" },
                                    { payee_id: ((_c = friends[i].friend_id) === null || _c === void 0 ? void 0 : _c._id) || "NA" },
                                ],
                            },
                            {
                                $and: [
                                    { payee_mobile: friends[i].friend_mobile || "NA" },
                                    { payee_id: id || "NA" },
                                ],
                            },
                            {
                                $and: [
                                    { payer_id: id || "NA" },
                                    { payee_mobile: friends[i].friend_mobile || "NA" },
                                ],
                            },
                        ],
                    });
                    let amount = 0;
                    for (let j = 0; j < balance.length; j++) {
                        if (balance[j].payer_id === id) {
                            amount += balance[j].amount;
                        }
                        else {
                            amount -= balance[j].amount;
                        }
                    }
                    friends[i].balance = amount;
                }
                res.json({
                    data: friends,
                    pagination: { page: pageNumber, pageSize: pageSize, total: total },
                });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    addFriend(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, name, mobile } = req.body;
                if (!userId) {
                    return res.status(400).json({ message: "User id are required" });
                }
                let tempFriend = yield friend_1.default.findOne({
                    user_id: userId,
                    friend_mobile: mobile,
                });
                if (tempFriend) {
                    return res.status(400).json({ message: "Friend already exists" });
                }
                let friendId = "";
                const user = yield user_1.default.findOne({ mobile: mobile });
                if (user) {
                    friendId = user._id.toString();
                }
                const friend = new friend_1.default({
                    user_id: userId,
                    friend_id: friendId || null,
                    friend_mobile: mobile,
                    friend_name: name,
                });
                yield friend.save();
                res.json({ message: "Friend added successfully", data: friend });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    deleteFriend(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, mobile } = req.body;
                if (!userId) {
                    return res
                        .status(400)
                        .json({ message: "User id and friend id are required" });
                }
                yield friend_1.default.deleteOne({ user_id: userId, friend_mobile: mobile });
                res.json({ message: "Friend deleted successfully" });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.FriendController = FriendController;
