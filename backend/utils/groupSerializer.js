// Populates member refs and shapes group docs for API responses.
// Keeps the shape the frontend already expects: members => [{ _id, name, email, ... }]
export const populateGroup = (query) =>
  query
    .populate("members.user", "name email")
    .populate("members.addedBy", "name");

export const renderGroup = (doc, { currentUserId } = {}) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;

  obj.members = (obj.members || []).map((m) => {
    const user = m.user && typeof m.user === "object" ? m.user : { _id: m.user };
    const rendered = {
      _id: user._id,
      name: user.name || "…",
      email: user.email || "",
      membershipStatus: m.status || "invited",
      invitedBy: m.addedBy && m.addedBy.name ? m.addedBy.name : m.addedBy,
      invitedAt: m.invitedAt,
    };
    return rendered;
  });

  if (currentUserId) {
    const mine = (obj.members || []).find((m) => String(m._id) === String(currentUserId));
    if (mine && mine.membershipStatus === "invited") {
      obj.invite = { invitedBy: mine.invitedBy, invitedAt: mine.invitedAt };
    }
  }

  delete obj.__v;
  return obj;
};

export const renderGroups = (docs, opts = {}) =>
  (docs || []).map((d) => renderGroup(d, opts));