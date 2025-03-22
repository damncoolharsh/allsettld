"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const groupMemeberSchema = new mongoose_1.default.Schema({
    group_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    member_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    mobile: { type: String },
    name: { type: String },
    joined_at: { type: Date, default: Date.now },
});
const GroupMember = mongoose_1.default.model("GroupMember", groupMemeberSchema);
exports.default = GroupMember;
