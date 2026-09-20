import Group from "../models/Group.js";

// Active membership only — invited/declined users have no group access.
// Uses $elemMatch so all conditions must apply to the SAME member subdoc.
export const canAccessGroup = (userId, groupId) =>
  Group.findOne({
    _id: groupId,
    members: { $elemMatch: { user: userId, status: "active" } },
  }).select("_id createdBy members name");

export const getMyGroupIds = async (userId) => {
  const groups = await Group.find({
    members: { $elemMatch: { user: userId, status: "active" } },
  }).select("_id");
  return groups.map((g) => g._id);
};

export const isGroupCreator = (group, userId) =>
  group && String(group.createdBy) === String(userId);

export const memberById = (group, userId) =>
  (group.members || []).find((m) => String(m.user) === String(userId));

export const activeMembers = (group) =>
  (group.members || []).filter((m) => m.status === "active");

export const activeMemberIds = (group) =>
  activeMembers(group).map((m) => String(m.user));

export const pendingMembers = (group) =>
  (group.members || []).filter((m) => m.status === "invited");