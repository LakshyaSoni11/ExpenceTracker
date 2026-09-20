import mongoose from "mongoose";
import User from "../models/User.js";
import Group from "../models/Group.js";

// Idempotent data migration for pre-verification / pre-invite schema.
// Returns true when there was nothing left to migrate (fast path).
const migrate = async () => {
  const isLegacyMemberArray = (g) =>
    g.members && g.members.length > 0 && g.members[0] instanceof mongoose.Types.ObjectId;

  const legacyGroups = await Group.find({ "members.user": { $exists: false } }).select("members createdBy createdAt");
  for (const group of legacyGroups) {
    if (!isLegacyMemberArray(group)) continue;
    const now = group.createdAt || new Date();
    group.members = group.members.map((id) => ({
      user: id,
      status: "active",
      addedBy: group.createdBy,
      invitedAt: now,
    }));
    await group.save();
    console.log(`[migrate] group ${group._id} members converted to invited/active shape`);
  }
  if (legacyGroups.length > 0) {
    console.log(`[migrate] migrated ${legacyGroups.length} legacy group(s)`);
  }

  // Existing users created before verification existed are treated as verified
  const r = await User.updateMany(
    { isVerified: { $exists: false } },
    { $set: { isVerified: true } }
  );
  if (r.modifiedCount > 0) {
    console.log(`[migrate] backfilled isVerified for ${r.modifiedCount} existing user(s)`);
  }
};

export default migrate;