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
const express_validator_1 = require("express-validator");
const group_1 = __importDefault(require("../models/group"));
const router = express_1.default.Router();
router.get("/", auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            return res.status(400).json({ message: "Group id is required" });
        }
        const pageSize = 20;
        const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
        const groups = yield group_1.default.find({ members: { $in: [id] } })
            .skip(pageNumber)
            .limit(pageSize);
        console.log("🚀 ~ router.get ~ id:", id);
        const total = yield group_1.default.countDocuments();
        res.json({
            data: groups,
            pagination: { page: pageNumber, pageSize: pageSize, total: total },
        });
    }
    catch (err) {
        console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.post("/createGroup", auth_1.verifyToken, [
    (0, express_validator_1.check)("name", "Group name is required").not().isEmpty(),
    (0, express_validator_1.check)("userId", "User id is required").isString(),
    (0, express_validator_1.check)("description", "Description is required").isString(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const newGroup = new group_1.default({
            name: name,
            createdBy: req.body.userId,
            description: req.body.description,
        });
        yield newGroup.save();
        res.json({ message: "Group created successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/updateGroup", auth_1.verifyToken, [(0, express_validator_1.check)("groupId", "Group Id is required").not().isEmpty()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { name, description, groupId, members } = req.body;
        const group = yield group_1.default.findOne({ _id: groupId });
        if (!group) {
            res.status(400).json({ message: "Group not found" });
            return;
        }
        if (name)
            group.name = name;
        if (description)
            group.description = description;
        if (members)
            group.members = members;
        yield group.save();
        res.json({ message: "Group updated successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
exports.default = router;
