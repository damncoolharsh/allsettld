"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const friendSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    profilePic: { type: String },
    balance: { type: Number, default: 0 },
    userId: { type: String, required: true },
    friendId: { type: String },
});
const Friend = mongoose_1.default.model("Friend", friendSchema);
exports.default = Friend;
