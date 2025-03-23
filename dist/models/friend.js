"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const friendSchema = new mongoose_1.default.Schema({
    user_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    user_mobile: { type: String },
    friend_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    friend_mobile: { type: String },
    friend_name: { type: String },
    created_at: { type: Date, default: Date.now },
});
const Friend = mongoose_1.default.model("Friend", friendSchema);
exports.default = Friend;
