import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Group from "../models/group";
import GroupMember, { GroupMemberType } from "../models/groupMember";
import Balance from "../models/balance";
import Friend from "../models/friend";
import User from "../models/user";
import Activity, { ActivityType } from "../models/activity";

interface BalanceInfoType {
  balance?: number;
  status?: string;
}

type GroupWithBalance = GroupMemberType & BalanceInfoType;

export class GroupController {
  getGroups = async (req: Request, res: Response) => {
    try {
      const userId = req.query?.id as string; // Renamed for clarity
      if (!userId) {
        return res.status(400).json({ message: "User id is required" });
      }

      if (req.query?.groupId) {
        // Fetch single group details including members with balance
        const groupId = req.query.groupId as string;
        const group = await Group.findOne({ _id: groupId });
        if (!group) {
          return res.status(400).json({ message: "Group not found" });
        }
        const members = await this._getGroupMembersWithBalance(groupId, userId);
        const result = { ...group.toJSON(), members };
        return res.json({ data: result });
      } else {
        // Fetch list of groups the user is part of, including members with balance for each
        const pageSize = 20;
        const pageNumber = parseInt(
          req.query.page ? req.query.page.toString() : "0"
        );

        // Find GroupMember entries to get the group IDs the user belongs to
        const groupMemberships = await GroupMember.find({ member_id: userId })
          .select("group_id") // Only need group_id
          .lean(); // Use lean for performance

        const groupIds = groupMemberships.map((gm) => gm.group_id);

        // Fetch the actual groups with pagination
        const groupsQuery = Group.find({ _id: { $in: groupIds } });
        const total = await Group.countDocuments({ _id: { $in: groupIds } });
        const groupsData = await groupsQuery
          .skip(pageNumber * pageSize)
          .limit(pageSize)
          .lean(); // Use lean for performance

        // Enhance each group with its members and their balances
        const groupsWithMembers = [];
        for (const group of groupsData) {
          const members = await this._getGroupMembersWithBalance(
            group._id.toString(),
            userId
          );
          groupsWithMembers.push({ ...group, members });
        }

        res.json({
          data: groupsWithMembers,
          pagination: { page: pageNumber, pageSize: pageSize, total: total },
        });
      }
    } catch (err) {
      console.log("🚀 ~ file: group.ts:getGroups ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  async _getGroupMembersWithBalance(
    groupId: string,
    userId: string
  ): Promise<GroupWithBalance[]> {
    const membersData = await GroupMember.find({
      group_id: groupId,
    }).populate("member_id");
    let members: GroupWithBalance[] = membersData.map((val) => val.toJSON());

    for (let i = 0; i < members.length; i++) {
      if (members[i].member_id) {
        const balance = await Balance.findOne({
          $and: [
            { group_id: groupId },
            {
              $or: [
                {
                  $and: [
                    { payer_id: members[i].member_id?._id || "NA" },
                    { payee_id: userId || "NA" },
                  ],
                },
                {
                  $and: [
                    { payer_id: userId || "NA" },
                    { payee_id: members[i].member_id?._id || "NA" },
                  ],
                },
              ],
            },
          ],
        });
        let amount = balance?.amount || 0;
        if (balance?.payer_id !== members[i].member_id?._id.toString()) {
          amount = amount * -1;
        }
        members[i].balance = amount;
      } else {
        // Handle non-registered members (identified by mobile)
        const balance = await Balance.findOne({
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

        let amount = balance?.amount || 0;
        // If the balance record shows the non-registered member as the payee, it means the user owes them, so the balance is negative from the user's perspective.
        if (balance?.payee_mobile === members[i].mobile) {
          amount = amount * -1;
        }
        // If the balance record shows the non-registered member as the payer, it means they owe the user, so the balance is positive.
        // No change needed for amount in this case as it's already positive.
        members[i].balance = amount;
      }
    }
    return members;
  }

  getGroupMembers = async (req: Request, res: Response) => {
    try {
      const id = req.query?.id as string;
      const userId = req.query?.userId as string;
      if (!id) {
        return res.status(400).json({ message: "Group id is required" });
      }
      if (!userId) {
        return res.status(400).json({ message: "User id is required" });
      }
      const group = await Group.findOne({ _id: id });
      if (!group) {
        return res.status(400).json({ message: "Group not found" });
      }

      const members = await this._getGroupMembersWithBalance(id, userId);
      const result = { ...group.toJSON(), members };
      res.json({ data: result });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:getGroupMembers ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  async createGroup(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name } = req.body;
      const image = req.file?.path;
      const newGroup = new Group({
        name: name,
        created_by: req.body.userId,
        description: req.body.description,
        image: image,
      });
      const newGroupMember = new GroupMember({
        group_id: newGroup._id,
        member_id: req.body.userId,
      });
      const activity = new Activity({
        groupId: newGroup._id,
        userId: req.body.userId,
        activityType: ActivityType.GROUP_CREATED,
        details: { groupName: newGroup.name },
        timestamp: new Date(),
      });
      await activity.save();
      await newGroupMember.save();
      await newGroup.save();
      res.json({ message: "Group created successfully", data: newGroup });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async updateGroup(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, groupId, members } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      if (name) group.name = name;
      if (description) group.description = description;
      if (req.file?.path) group.image = req.file.path;
      await group.save();
      res.json({ message: "Group updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async addMember(req: Request, res: Response) {
    try {
      const { groupId, memberId, name, mobile, userId } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      if (memberId) {
        const newGroupMember = new GroupMember({
          group_id: group._id,
          member_id: memberId,
        });
        await newGroupMember.save();
      } else {
        const user = await User.findOne({ mobile: mobile });
        if (user) {
          const newGroupMember = new GroupMember({
            group_id: group._id,
            member_id: user._id,
          });
          await newGroupMember.save();
        }
        const newGroupMember = new GroupMember({
          group_id: group._id,
          name: name,
          mobile: mobile,
        });
        await newGroupMember.save();
      }
      const allMembers = await GroupMember.find({ group_id: groupId });
      for (let i = 0; i < allMembers.length; i++) {
        let userId = allMembers[i].member_id;
        const user1 = userId?.toString();
        let user1Mobile = allMembers[i].mobile;

        if (user1Mobile) {
          const mobileUser = await User.findOne({ mobile: user1Mobile });
          if (mobileUser) {
            userId = mobileUser._id;
            user1Mobile = undefined;
          }
        }

        const friendRel1 = await Friend.findOne({
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
        const friendRel2 = await Friend.findOne({
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
          const friend = new Friend({
            user_id: user1 || null,
            user_mobile: user1Mobile || null,
            friend_id: memberId || null,
            friend_mobile: mobile || null,
            friend_name: name || null,
          });
          await friend.save();
        }
        if (!friendRel2) {
          const friend = new Friend({
            user_id: memberId || null,
            friend_mobile: user1Mobile || null,
            friend_id: user1 || null,
            user_mobile: mobile || null,
            friend_name: name || null,
          });
          await friend.save();
        }
      }
      const activity = new Activity({
        groupId: group._id,
        userId: userId,
        activityType: ActivityType.MEMBER_ADDED,
        details: {
          groupName: group.name,
          memberName: name,
        },
      });
      await activity.save();
      res.json({ message: "Member added successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async bulkAddMember(req: Request, res: Response) {
    try {
      const { groupId, members, userId } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      const newGroupMembers: any[] = [];
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const alreadyMember = await GroupMember.findOne({
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
        const user = await User.findOne({ mobile: member.mobile });
        if (user) {
          member.id = user._id;
        }
        if (member.id) {
          newGroupMembers.push(
            new GroupMember({
              group_id: group._id,
              member_id: member.id,
              name: member.name,
            })
          );
        } else {
          newGroupMembers.push(
            new GroupMember({
              group_id: group._id,
              name: member.name,
              mobile: member.mobile,
            })
          );
        }
      }
      const newMembers = await GroupMember.insertMany(newGroupMembers);
      const allMembers = await GroupMember.find({ group_id: groupId });
      for (let i = 0; i < allMembers.length; i++) {
        for (let j = i + 1; j < allMembers.length; j++) {
          if (i === j) continue;
          const userId = allMembers[i].member_id;
          const user1 = userId?.toString();
          const user1Mobile = allMembers[i].mobile;

          const memberId = allMembers[j].member_id;
          const mobile = allMembers[j].mobile;

          const friendRel1 = await Friend.findOne({
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
          const friendRel2 = await Friend.findOne({
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
            const friend = new Friend({
              user_id: user1 || null,
              user_mobile: user1Mobile || null,
              friend_id: memberId || null,
              friend_mobile: mobile || null,
              friend_name: allMembers[j].name || null,
            });
            await friend.save();
          }
          if (!friendRel2) {
            const friend = new Friend({
              user_id: memberId || null,
              friend_mobile: user1Mobile || null,
              friend_id: user1 || null,
              user_mobile: mobile || null,
              friend_name: allMembers[i].name || null,
            });
            await friend.save();
          }
        }
      }
      const activity = new Activity({
        groupId: group._id,
        userId: userId,
        activityType: ActivityType.MEMBER_ADDED,
        details: {
          groupName: group.name,
          members: newMembers.map((val) => val.name),
        },
      });
      await activity.save();
      res.json({ message: "Members added successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { groupId, memberId, mobile } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      if (memberId) {
        await GroupMember.deleteOne({ group_id: groupId, member_id: memberId });
      } else {
        await GroupMember.deleteOne({ group_id: groupId, mobile: mobile });
      }
      const activity = new Activity({
        groupId: group._id,
        userId: req.body.userId,
        activityType: ActivityType.MEMBER_REMOVED,
        details: {
          groupName: group.name,
        },
      });
      await activity.save();
      res.json({ message: "Member removed successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
}
