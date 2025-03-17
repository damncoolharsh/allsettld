import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Group from "../models/group";
import GroupMember, { GroupMemberType } from "../models/groupMember";
import Balance from "../models/balance";
import { Document, Types } from "mongoose";
import { ObjectId } from "mongodb";
import Friend from "../models/friend";

interface BalanceInfoType {
  balance?: number;
  status?: string;
}

type GroupWithBalance = GroupMemberType & BalanceInfoType;

export class GroupController {
  async getGroups(req: Request, res: Response) {
    try {
      const id = req.query?.id as string;
      if (!id) {
        return res.status(400).json({ message: "User id is required" });
      }

      if (req.query?.groupId) {
        const group = await Group.findOne({ _id: req.query.groupId });
        if (!group) {
          return res.status(400).json({ message: "Group not found" });
        }
        return res.json({ data: group });
      } else {
        const pageSize = 20;
        const pageNumber = parseInt(
          req.query.page ? req.query.toString() : "0"
        );
        const groups = await GroupMember.find({
          member_id: id,
        })
          .populate("group_id")
          .skip(pageNumber)
          .limit(pageSize);
        const total = await GroupMember.find({
          member_id: id,
        }).countDocuments();

        res.json({
          data: groups,
          pagination: { page: pageNumber, pageSize: pageSize, total: total },
        });
      }
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getGroupMembers(req: Request, res: Response) {
    try {
      const id = req.query?.id;
      const userId = req.query?.userId;
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
      const membersData = await GroupMember.find({
        group_id: id,
      }).populate("member_id");
      let members: GroupWithBalance[] = membersData.map((val) => val.toJSON());
      for (let i = 0; i < members.length; i++) {
        if (members[i].member_id) {
          const balance = await Balance.findOne({
            $and: [
              { group_id: id },
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
          if (balance?.payer_id === members[i].member_id?._id?.toString()) {
            amount = amount * -1;
          }
          members[i].balance = amount;
        } else {
          const balance = await Balance.findOne({
            $and: [
              { group_id: id },
              {
                $or: [
                  {
                    $and: [
                      { payer_id: userId || "NA" },
                      { payee_mobile: members[i].mobile || "NA" },
                    ],
                  },
                ],
              },
            ],
          });

          let amount = balance?.amount || 0;
          if (balance?.payee_mobile === members[i].mobile) {
            amount = amount * -1;
          }
          members[i].balance = amount;
        }
      }
      const result = { ...group.toJSON(), members };
      res.json({ data: result });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

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
      const { groupId, memberId, name, mobile } = req.body;
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
        const newGroupMember = new GroupMember({
          group_id: group._id,
          name: name,
          mobile: mobile,
        });
        await newGroupMember.save();
      }
      res.json({ message: "Member added successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  async bulkAddMember(req: Request, res: Response) {
    try {
      const { groupId, members } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      const newGroupMembers: any[] = [];
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        console.log("🚀 ~ GroupController ~ bulkAddMember ~ member:", member);
        const alreadyMember = await GroupMember.findOne({
          $and: [
            { group_id: groupId },
            { $or: [{ member_id: member.id }, { mobile: member.mobile }] },
          ],
        });
        if (alreadyMember) {
          continue;
        }
        if (member.id) {
          newGroupMembers.push(
            new GroupMember({
              group_id: group._id,
              member_id: member.id,
            })
          );
        }
        newGroupMembers.push(
          new GroupMember({
            group_id: group._id,
            name: member.name,
            mobile: member.mobile,
          })
        );
      }
      await GroupMember.insertMany(newGroupMembers);
      const allMembers = await GroupMember.find({ group_id: groupId });
      for (let i = 0; i < allMembers.length; i++) {
        for (let j = i + 1; j < allMembers.length; j++) {
          if (i === j) continue;
          const user1 = allMembers[i];
          const user2 = allMembers[j];

          if (user1.member_id && user2.member_id) {
            const friendRel1 = await Friend.findOne({
              $and: [
                { friend_id: user1.member_id },
                { user_id: user2.member_id },
              ],
            });
            const friendRel2 = await Friend.findOne({
              $and: [
                { friend_id: user2.member_id },
                { user_id: user1.member_id },
              ],
            });
            if (!friendRel1) {
              const friend = new Friend({
                user_id: user1.member_id,
                friend_id: user2.member_id,
                friend_mobile: user2.mobile,
                friend_name: user2.name,
              });
              await friend.save();
            }
            if (!friendRel2) {
              const friend = new Friend({
                user_id: user2.member_id,
                friend_id: user1.member_id,
                friend_mobile: user1.mobile,
                friend_name: user1.name,
              });
              await friend.save();
            }
          } else if (user1.mobile && user2.mobile) {
            const friendRel1 = await Friend.findOne({
              $and: [
                { friend_mobile: user1.mobile },
                { user_mobile: user2.mobile },
              ],
            });
            const friendRel2 = await Friend.findOne({
              $and: [
                { friend_mobile: user2.mobile },
                { user_mobile: user1.mobile },
              ],
            });
            if (!friendRel1) {
              const friend = new Friend({
                user_mobile: user1.mobile,
                friend_mobile: user2.mobile,
                friend_name: user2.name,
              });
              await friend.save();
            }
            if (!friendRel2) {
              const friend = new Friend({
                user_mobile: user2.mobile,
                friend_mobile: user1.mobile,
                friend_name: user1.name,
              });
              await friend.save();
            }
          } else if (user1.member_id && user2.mobile) {
            const friendRel1 = await Friend.findOne({
              $and: [
                { friend_id: user1.member_id },
                { user_mobile: user2.mobile },
              ],
            });
            const friendRel2 = await Friend.findOne({
              $and: [
                { friend_mobile: user2.mobile },
                { user_id: user1.member_id },
              ],
            });
            if (!friendRel1) {
              const friend = new Friend({
                user_id: user1.member_id,
                friend_mobile: user2.mobile,
                friend_name: user2.name,
              });
              await friend.save();
            }
            if (!friendRel2) {
              const friend = new Friend({
                user_mobile: user2.mobile,
                friend_id: user1.member_id,
                friend_name: user1.name,
              });
              await friend.save();
            }
          } else if (user1.mobile && user2.member_id) {
            const friendRel1 = await Friend.findOne({
              $and: [
                { friend_id: user2.member_id },
                { user_mobile: user1.mobile },
              ],
            });
            const friendRel2 = await Friend.findOne({
              $and: [
                { friend_mobile: user1.mobile },
                { user_id: user2.member_id },
              ],
            });
            if (!friendRel1) {
              const friend = new Friend({
                user_id: user2.member_id,
                friend_mobile: user1.mobile,
                friend_name: user1.name,
              });
              await friend.save();
            }
            if (!friendRel2) {
              const friend = new Friend({
                user_mobile: user1.mobile,
                friend_id: user2.member_id,
                friend_name: user2.name,
              });
              await friend.save();
            }
          }
        }
      }
      console.log(
        "🚀 ~ GroupController ~ bulkAddMember ~ allMembers:",
        allMembers
      );
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
      res.json({ message: "Member removed successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
}
