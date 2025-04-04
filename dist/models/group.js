"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const groupSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    image: { type: String },
});
const Group = mongoose_1.default.model("Group", groupSchema);
exports.default = Group;
