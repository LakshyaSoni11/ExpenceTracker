import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";
import User from "../models/User.js";
import {
  canAccessGroup,
  isGroupCreator,
  memberById,
  activeMemberIds,
} from "../utils/access.js";
import { populateGroup, renderGroup, renderGroups } from "../utils/groupSerializer.js";
import { emitToUsers } from "../utils/realtime.js";

const MAX_MEMBERS = 30;

// Create group — creator is auto-added as active; others are invited until they accept
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }
    const creatorId = req.user._id;
    const memberIds = Array.isArray(members)
      ? [...new Set(members.map((m) => String(m)).filter((m) => m && String(m) !== String(creatorId)))]
      : [];

    if (memberIds.length < 1) {
      return res.status(400).json({ message: "Add at least one other member" });
    }
    if (memberIds.length > MAX_MEMBERS - 1) {
      return res.status(400).json({ message: "Too many members" });
    }

    const valid = await User.find({ _id: { $in: memberIds } }).select("_id");
    if (valid.length !== memberIds.length) {
      return res.status(400).json({ message: "One or more members are not registered users" });
    }

    const creator = await User.findById(creatorId).select("name");

    const groups = await Group.create({
      name: name.trim(),
      createdBy: creatorId,
      members: [
        { user: creatorId, status: "active", addedBy: creatorId },
        ...valid.map((u) => ({ user: u._id, status: "invited", addedBy: creatorId })),
      ],
    });
    const populated = await populateGroup(Group.findById(groups._id));
    const rendered = renderGroup(populated, { currentUserId: req.user._id });

    emitToUsers([creatorId], "group:created", { groupId: rendered._id, groupName: rendered.name });
    emitToUsers(
      memberIds,
      "invite:new",
      { groupId: rendered._id, groupName: rendered.name, invitedByName: creator.name }
    );

    res.status(201).json(rendered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get groups the user is an active member of
export const getGroups = async (req, res) => {
  try {
    const groups = await populateGroup(
      Group.find({ members: { $elemMatch: { user: req.user._id, status: "active" } } }).sort({ createdAt: -1 })
    );
    res.json(renderGroups(groups, { currentUserId: req.user._id }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single group the user belongs to
export const getGroupById = async (req, res) => {
  try {
    const group = await populateGroup(canAccessGroup(req.user._id, req.params.id));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(renderGroup(group, { currentUserId: req.user._id }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pending invitations for the current user
export const getInvites = async (req, res) => {
  try {
    const groups = await populateGroup(
      Group.find({ members: { $elemMatch: { user: req.user._id, status: "invited" } } }).sort({ createdAt: -1 })
    );
    res.json(renderGroups(groups, { currentUserId: req.user._id }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept a pending invitation
export const acceptInvite = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      members: { $elemMatch: { user: req.user._id, status: "invited" } },
    });
    if (!group) {
      return res.status(404).json({ message: "Invite not found or already handled" });
    }
    memberById(group, req.user._id).status = "active";
    await group.save();
    const populated = await populateGroup(Group.findById(group._id));
    const rendered = renderGroup(populated);

    emitToUsers(activeMemberIds(group), "group:member-changed", {
      groupId: rendered._id,
      groupName: rendered.name,
    });
    emitToUsers(req.user._id, "group:created", { groupId: rendered._id, groupName: rendered.name });

    res.json(rendered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Decline a pending invitation
export const declineInvite = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      members: { $elemMatch: { user: req.user._id, status: "invited" } },
    });
    if (!group) {
      return res.status(404).json({ message: "Invite not found or already handled" });
    }
    memberById(group, req.user._id).status = "declined";
    await group.save();
    emitToUsers(activeMemberIds(group), "group:member-changed", {
      groupId: group._id,
      groupName: group.name,
    });
    res.json({ message: "Invite declined" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a member — creator only; sends an invitation (user must accept)
export const addMember = async (req, res) => {
  try {
    const group = await canAccessGroup(req.user._id, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!isGroupCreator(group, req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can add members" });
    }

    const { memberId, email } = req.body;
    let user = null;
    if (memberId) {
      user = await User.findById(memberId).select("_id");
    } else if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("_id");
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (String(user._id) === String(group.createdBy)) {
      return res.status(400).json({ message: "The group creator is already a member" });
    }

    const existing = memberById(group, user._id);
    if (existing) {
      if (existing.status === "active") {
        return res.status(400).json({ message: "User is already a member" });
      }
      if (existing.status === "invited") {
        return res.status(400).json({ message: "Invite is already pending for this user" });
      }
      existing.status = "invited";
      existing.addedBy = req.user._id;
      existing.invitedAt = new Date();
    } else {
      if (group.members.length >= MAX_MEMBERS) {
        return res.status(400).json({ message: "Group member limit reached" });
      }
      group.members.push({ user: user._id, status: "invited", addedBy: req.user._id });
    }

    await group.save();
    const populated = await populateGroup(Group.findById(group._id));
    const rendered = renderGroup(populated);

    emitToUsers(activeMemberIds(group), "group:member-changed", {
      groupId: rendered._id,
      groupName: rendered.name,
    });
    emitToUsers(user._id, "invite:new", {
      groupId: rendered._id,
      groupName: rendered.name,
      invitedByName: req.user.name,
    });

    res.json(rendered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a member — creator can remove anyone (except themselves); a member can leave
export const removeMember = async (req, res) => {
  try {
    const group = await canAccessGroup(req.user._id, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const targetId = req.params.memberId;
    if (String(targetId) === String(group.createdBy)) {
      return res.status(400).json({ message: "The group creator cannot be removed" });
    }

    const isCreator = isGroupCreator(group, req.user._id);
    const isSelf = String(targetId) === String(req.user._id);
    if (!isCreator && !isSelf) {
      return res.status(403).json({ message: "You can only leave or be removed by the creator" });
    }

    group.members = group.members.filter((m) => String(m.user) !== String(targetId));
    await group.save();
    const populated = await populateGroup(Group.findById(group._id));
    const rendered = renderGroup(populated);

    emitToUsers(activeMemberIds(group), "group:member-changed", {
      groupId: rendered._id,
      groupName: rendered.name,
    });

    res.json(rendered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete group — creator only; cascades to expenses and settlements
export const deleteGroup = async (req, res) => {
  try {
    const group = await canAccessGroup(req.user._id, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!isGroupCreator(group, req.user._id)) {
      return res.status(403).json({ message: "Only the group creator can delete the group" });
    }
    const memberIds = activeMemberIds(group);
    await Expense.deleteMany({ groupId: group._id });
    await Settlement.deleteMany({ groupId: group._id });
    await group.deleteOne();
    emitToUsers(memberIds, "group:deleted", { groupId: group._id });
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};