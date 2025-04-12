"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.GroupController = void 0;
const express_validator_1 = require("express-validator");
const group_1 = __importDefault(require("../models/group"));
const groupMember_1 = __importDefault(require("../models/groupMember"));
const balance_1 = __importDefault(require("../models/balance"));
const friend_1 = __importDefault(require("../models/friend"));
const user_1 = __importDefault(require("../models/user"));
const activity_1 = __importStar(require("../models/activity"));
class GroupController {
    constructor() {
        this.getGroups = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id; // Renamed for clarity
                if (!userId) {
                    return res.status(400).json({ message: "User id is required" });
                }
                if ((_b = req.query) === null || _b === void 0 ? void 0 : _b.groupId) {
                    // Fetch single group details including members with balance
                    const groupId = req.query.groupId;
                    const group = yield group_1.default.findOne({ _id: groupId });
                    if (!group) {
                        return res.status(400).json({ message: "Group not found" });
                    }
                    const members = yield this._getGroupMembersWithBalance(groupId, userId);
                    const result = Object.assign(Object.assign({}, group.toJSON()), { members });
                    return res.json({ data: result });
                }
                else {
                    // Fetch list of groups the user is part of, including members with balance for each
                    const pageSize = 20;
                    const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "0");
                    // Find GroupMember entries to get the group IDs the user belongs to
                    const groupMemberships = yield groupMember_1.default.find({ member_id: userId })
                        .select("group_id") // Only need group_id
                        .lean(); // Use lean for performance
                    const groupIds = groupMemberships.map((gm) => gm.group_id);
                    // Fetch the actual groups with pagination
                    const groupsQuery = group_1.default.find({ _id: { $in: groupIds } });
                    const total = yield group_1.default.countDocuments({ _id: { $in: groupIds } });
                    const groupsData = yield groupsQuery
                        .skip(pageNumber * pageSize)
                        .limit(pageSize)
                        .lean(); // Use lean for performance
                    // Enhance each group with its members and their balances
                    const groupsWithMembers = [];
                    for (const group of groupsData) {
                        const members = yield this._getGroupMembersWithBalance(group._id.toString(), userId);
                        groupsWithMembers.push(Object.assign(Object.assign({}, group), { members }));
                    }
                    res.json({
                        data: groupsWithMembers,
                        pagination: { page: pageNumber, pageSize: pageSize, total: total },
                    });
                }
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:getGroups ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        this.getGroupMembers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
                const userId = (_b = req.query) === null || _b === void 0 ? void 0 : _b.userId;
                if (!id) {
                    return res.status(400).json({ message: "Group id is required" });
                }
                if (!userId) {
                    return res.status(400).json({ message: "User id is required" });
                }
                const group = yield group_1.default.findOne({ _id: id });
                if (!group) {
                    return res.status(400).json({ message: "Group not found" });
                }
                const members = yield this._getGroupMembersWithBalance(id, userId);
                const result = Object.assign(Object.assign({}, group.toJSON()), { members });
                res.json({ data: result });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:getGroupMembers ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    _getGroupMembersWithBalance(groupId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const membersData = yield groupMember_1.default.find({
                group_id: groupId,
            }).populate("member_id");
            let members = membersData.map((val) => val.toJSON());
            for (let i = 0; i < members.length; i++) {
                if (members[i].member_id) {
                    const balance = yield balance_1.default.findOne({
                        $and: [
                            { group_id: groupId },
                            {
                                $or: [
                                    {
                                        $and: [
                                            { payer_id: ((_a = members[i].member_id) === null || _a === void 0 ? void 0 : _a._id) || "NA" },
                                            { payee_id: userId || "NA" },
                                        ],
                                    },
                                    {
                                        $and: [
                                            { payer_id: userId || "NA" },
                                            { payee_id: ((_b = members[i].member_id) === null || _b === void 0 ? void 0 : _b._id) || "NA" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    });
                    let amount = (balance === null || balance === void 0 ? void 0 : balance.amount) || 0;
                    if ((balance === null || balance === void 0 ? void 0 : balance.payer_id) !== ((_c = members[i].member_id) === null || _c === void 0 ? void 0 : _c._id.toString())) {
                        amount = amount * -1;
                    }
                    members[i].balance = amount;
                }
                else {
                    // Handle non-registered members (identified by mobile)
                    const balance = yield balance_1.default.findOne({
                        $and: [
                            { group_id: groupId },
                            {
                                $or: [
                                    // Case 1: User owes the non-registered member
                                    {
                                        $and: [
                                            { payer_id: userId || "NA" },
                                            { payee_mobile: members[i].mobile || "NA" },
                                        ],
                                    },
                                    // Case 2: Non-registered member owes the user (less common, but possible if manually created)
                                    {
                                        $and: [
                                            { payer_mobile: members[i].mobile || "NA" },
                                            { payee_id: userId || "NA" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    });
                    let amount = (balance === null || balance === void 0 ? void 0 : balance.amount) || 0;
                    // If the balance record shows the non-registered member as the payee, it means the user owes them, so the balance is negative from the user's perspective.
                    if ((balance === null || balance === void 0 ? void 0 : balance.payee_mobile) === members[i].mobile) {
                        amount = amount * -1;
                    }
                    // If the balance record shows the non-registered member as the payer, it means they owe the user, so the balance is positive.
                    // No change needed for amount in this case as it's already positive.
                    members[i].balance = amount;
                }
            }
            return members;
        });
    }
    createGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { name } = req.body;
                const image = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
                const newGroup = new group_1.default({
                    name: name,
                    created_by: req.body.userId,
                    description: req.body.description,
                    image: image,
                });
                const newGroupMember = new groupMember_1.default({
                    group_id: newGroup._id,
                    member_id: req.body.userId,
                });
                const activity = new activity_1.default({
                    groupId: newGroup._id,
                    userId: req.body.userId,
                    activityType: activity_1.ActivityType.GROUP_CREATED,
                    details: { groupName: newGroup.name },
                    timestamp: new Date(),
                });
                yield activity.save();
                yield newGroupMember.save();
                yield newGroup.save();
                res.json({ message: "Group created successfully", data: newGroup });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    updateGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
                    group.image = req.file.path;
                yield group.save();
                res.json({ message: "Group updated successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    addMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, memberId, name, mobile, userId } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                if (memberId) {
                    const newGroupMember = new groupMember_1.default({
                        group_id: group._id,
                        member_id: memberId,
                    });
                    yield newGroupMember.save();
                }
                else {
                    const user = yield user_1.default.findOne({ mobile: mobile });
                    if (user) {
                        const newGroupMember = new groupMember_1.default({
                            group_id: group._id,
                            member_id: user._id,
                        });
                        yield newGroupMember.save();
                    }
                    const newGroupMember = new groupMember_1.default({
                        group_id: group._id,
                        name: name,
                        mobile: mobile,
                    });
                    yield newGroupMember.save();
                }
                const allMembers = yield groupMember_1.default.find({ group_id: groupId });
                for (let i = 0; i < allMembers.length; i++) {
                    let userId = allMembers[i].member_id;
                    const user1 = userId === null || userId === void 0 ? void 0 : userId.toString();
                    let user1Mobile = allMembers[i].mobile;
                    if (user1Mobile) {
                        const mobileUser = yield user_1.default.findOne({ mobile: user1Mobile });
                        if (mobileUser) {
                            userId = mobileUser._id;
                            user1Mobile = undefined;
                        }
                    }
                    const friendRel1 = yield friend_1.default.findOne({
                        $and: [
                            {
                                $or: [
                                    ...(user1 ? [{ user_id: user1 }] : []),
                                    ...(user1Mobile ? [{ user_mobile: user1Mobile }] : []),
                                ],
                            },
                            {
                                $or: [
                                    ...(memberId ? [{ friend_id: memberId }] : []),
                                    ...(mobile ? [{ friend_mobile: mobile }] : []),
                                ],
                            },
                        ],
                    });
                    const friendRel2 = yield friend_1.default.findOne({
                        $and: [
                            {
                                $or: [
                                    ...(memberId ? [{ user_id: memberId }] : []),
                                    ...(mobile ? [{ user_mobile: mobile }] : []),
                                ],
                            },
                            {
                                $or: [
                                    ...(user1 ? [{ friend_id: user1 }] : []),
                                    ...(user1Mobile ? [{ friend_mobile: user1Mobile }] : []),
                                ],
                            },
                        ],
                    });
                    if (!friendRel1) {
                        const friend = new friend_1.default({
                            user_id: user1 || null,
                            user_mobile: user1Mobile || null,
                            friend_id: memberId || null,
                            friend_mobile: mobile || null,
                            friend_name: name || null,
                        });
                        yield friend.save();
                    }
                    if (!friendRel2) {
                        const friend = new friend_1.default({
                            user_id: memberId || null,
                            friend_mobile: user1Mobile || null,
                            friend_id: user1 || null,
                            user_mobile: mobile || null,
                            friend_name: name || null,
                        });
                        yield friend.save();
                    }
                }
                const activity = new activity_1.default({
                    groupId: group._id,
                    userId: userId,
                    activityType: activity_1.ActivityType.MEMBER_ADDED,
                    details: {
                        groupName: group.name,
                        memberName: name,
                    },
                });
                yield activity.save();
                res.json({ message: "Member added successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    bulkAddMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, members, userId } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                const newGroupMembers = [];
                for (let i = 0; i < members.length; i++) {
                    const member = members[i];
                    const alreadyMember = yield groupMember_1.default.findOne({
                        $and: [
                            { group_id: groupId },
                            {
                                $or: [
                                    ...(member.id ? [{ member_id: member.id }] : []),
                                    ...(member.mobile ? [{ mobile: member.mobile }] : []),
                                ],
                            },
                        ],
                    });
                    if (alreadyMember) {
                        continue;
                    }
                    const user = yield user_1.default.findOne({ mobile: member.mobile });
                    if (user) {
                        member.id = user._id;
                    }
                    if (member.id) {
                        newGroupMembers.push(new groupMember_1.default({
                            group_id: group._id,
                            member_id: member.id,
                            name: member.name,
                        }));
                    }
                    else {
                        newGroupMembers.push(new groupMember_1.default({
                            group_id: group._id,
                            name: member.name,
                            mobile: member.mobile,
                        }));
                    }
                }
                const newMembers = yield groupMember_1.default.insertMany(newGroupMembers);
                const allMembers = yield groupMember_1.default.find({ group_id: groupId });
                for (let i = 0; i < allMembers.length; i++) {
                    for (let j = i + 1; j < allMembers.length; j++) {
                        if (i === j)
                            continue;
                        const userId = allMembers[i].member_id;
                        const user1 = userId === null || userId === void 0 ? void 0 : userId.toString();
                        const user1Mobile = allMembers[i].mobile;
                        const memberId = allMembers[j].member_id;
                        const mobile = allMembers[j].mobile;
                        const friendRel1 = yield friend_1.default.findOne({
                            $and: [
                                {
                                    $or: [
                                        ...(user1 ? [{ user_id: user1 }] : []),
                                        ...(user1Mobile ? [{ user_mobile: user1Mobile }] : []),
                                    ],
                                },
                                {
                                    $or: [
                                        ...(memberId ? [{ friend_id: memberId }] : []),
                                        ...(mobile ? [{ friend_mobile: mobile }] : []),
                                    ],
                                },
                            ],
                        });
                        const friendRel2 = yield friend_1.default.findOne({
                            $and: [
                                {
                                    $or: [
                                        ...(memberId ? [{ user_id: memberId }] : []),
                                        ...(mobile ? [{ user_mobile: mobile }] : []),
                                    ],
                                },
                                {
                                    $or: [
                                        ...(user1 ? [{ friend_id: user1 }] : []),
                                        ...(user1Mobile ? [{ friend_mobile: user1Mobile }] : []),
                                    ],
                                },
                            ],
                        });
                        if (!friendRel1) {
                            const friend = new friend_1.default({
                                user_id: user1 || null,
                                user_mobile: user1Mobile || null,
                                friend_id: memberId || null,
                                friend_mobile: mobile || null,
                                friend_name: allMembers[j].name || null,
                            });
                            yield friend.save();
                        }
                        if (!friendRel2) {
                            const friend = new friend_1.default({
                                user_id: memberId || null,
                                friend_mobile: user1Mobile || null,
                                friend_id: user1 || null,
                                user_mobile: mobile || null,
                                friend_name: allMembers[i].name || null,
                            });
                            yield friend.save();
                        }
                    }
                }
                const activity = new activity_1.default({
                    groupId: group._id,
                    userId: userId,
                    activityType: activity_1.ActivityType.MEMBER_ADDED,
                    details: {
                        groupName: group.name,
                        members: newMembers.map((val) => val.name),
                    },
                });
                yield activity.save();
                res.json({ message: "Members added successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    removeMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, memberId, mobile } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                if (memberId) {
                    yield groupMember_1.default.deleteOne({ group_id: groupId, member_id: memberId });
                }
                else {
                    yield groupMember_1.default.deleteOne({ group_id: groupId, mobile: mobile });
                }
                const activity = new activity_1.default({
                    groupId: group._id,
                    userId: req.body.userId,
                    activityType: activity_1.ActivityType.MEMBER_REMOVED,
                    details: {
                        groupName: group.name,
                    },
                });
                yield activity.save();
                res.json({ message: "Member removed successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
}
exports.GroupController = GroupController;
