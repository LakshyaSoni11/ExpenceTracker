export const memberId = (m) =>
  typeof m === 'string' ? m : m?._id || m?.id;

export const memberName = (m) =>
  typeof m === 'string' ? m : m?.name || m?.email || memberId(m);

export const memberLabel = (m) =>
  typeof m === 'string' ? m : m?.name ? `${m.name}${m.email ? ` (${m.email})` : ''}` : memberId(m);

export const buildMemberNameMap = (groups) => {
  const map = {};
  (groups || []).forEach((g) => {
    (g.members || []).forEach((m) => {
      const id = memberId(m);
      if (id) map[id] = memberName(m);
    });
  });
  return map;
};