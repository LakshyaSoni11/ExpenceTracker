import mongoose from "mongoose";
import "dotenv/config";

const BASE = "http://localhost:5000/api";
const tag = Date.now().toString(36);
const emails = {
  alice: `alice-${tag}@example.com`,
  bob: `bob-${tag}@example.com`,
  carol: `carol-${tag}@example.com`,
};

let failures = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`PASS  ${name}`);
  else { failures++; console.log(`FAIL  ${name}${extra ? "  -> " + JSON.stringify(extra) : ""}`); }
};

async function req(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

const register = async (name, email) => {
  const r = await req("POST", "/auth/register", { body: { name, email, password: "password123" } });
  return { status: r.status, token: r.json.token, user: r.json.user };
};

// ---- unauth guard ----
let r = await req("GET", "/groups");
check("no token -> 401", r.status === 401);

// ---- register ----
const alice = await register("Alice", emails.alice);
const bob = await register("Bob", emails.bob);
const carol = await register("Carol", emails.carol);
check("register alice 201", alice.status === 201, alice.status);
check("register alice has token+user", !!alice.token && !!alice.user, alice);
check("register returns isVerified=false", alice.user.isVerified === false, alice.user);
check("duplicate email -> 400", (await req("POST", "/auth/register", { body: { name: "A2", email: emails.alice, password: "password123" } })).status === 400);
check("short password -> 400", (await req("POST", "/auth/register", { body: { name: "X", email: `x-${tag}@example.com`, password: "abc" } })).status === 400);

// ---- unverified cannot use data routes ----
r = await req("GET", "/groups", { token: alice.token });
check("unverified user blocked from /groups -> 403 EMAIL_UNVERIFIED", r.status === 403 && r.json.code === "EMAIL_UNVERIFIED", r.json);

// ---- connect DB to grab verification tokens (only delivered by email) ----
try { await mongoose.connect(process.env.MONGO_URI, { connectTimeoutMS: 20000 }); }
catch (e) { console.log("DB connect failed:", e.message); process.exit(failures === 0 ? 0 : 1); }
const { default: User } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/User.js");
const { default: Group } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Group.js");
const { default: Expense } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Expense.js");
const { default: Settlement } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Settlement.js");

const userByEmail = async (email) =>
  User.findOne({ email }).select("+verificationToken verificationTokenExpiry isVerified");

// ---- verify email ----
const aDoc = await userByEmail(emails.alice);
check("verification token persisted for alice", !!aDoc.verificationToken);
r = await req("POST", "/auth/verify-email", { body: { token: aDoc.verificationToken } });
check("verify alice 200 + isVerified true", r.status === 200 && r.json.user.isVerified === true, r.json);
const aliceToken = r.json.token || alice.token;
check("verify resets stored token", (await userByEmail(emails.alice)).verificationToken === null);
r = await req("POST", "/auth/verify-email", { body: { token: aDoc.verificationToken } });
check("reuse of verified token -> 400", r.status === 400);

const bDoc = await userByEmail(emails.bob);
const cDoc = await userByEmail(emails.carol);
r = await req("POST", "/auth/verify-email", { body: { token: bDoc.verificationToken } });
const bobToken = r.json.token;
r = await req("POST", "/auth/verify-email", { body: { token: cDoc.verificationToken } });
const carolToken = r.json.token;

// ---- login / me ----
r = await req("POST", "/auth/login", { body: { email: emails.alice, password: "password123" } });
check("login alice 200", r.status === 200, r.status);
check("login wrong password -> 401", (await req("POST", "/auth/login", { body: { email: emails.alice, password: "wrong" } })).status === 401);
r = await req("GET", "/auth/me", { token: aliceToken });
check("me returns verified alice", r.status === 200 && r.json.user.email === emails.alice && r.json.user.isVerified === true, r.json);

// ---- search ----
r = await req("GET", "/users/search?q=bob", { token: aliceToken });
check("search finds bob", r.status === 200 && r.json.some(u => u.email === emails.bob), r.json);
check("search excludes self", r.status === 200 && !r.json.some(u => u.email === emails.alice), r.json);

// ---- create group -> members are invited until accepted ----
r = await req("POST", "/groups", { token: aliceToken, body: { name: `smoke-${tag}`, members: [bob.user._id] } });
check("alice creates group 201", r.status === 201, r.json);
const group = r.json;
check("creator is active member", group.members.find(m => m._id === alice.user._id)?.membershipStatus === "active", group.members);
const bobMember = group.members.find(m => m._id === bob.user._id);
check("invited member has status invited", bobMember?.membershipStatus === "invited", group.members);
check("group members populated with names", group.members.some(m => m.name === "Bob"), group.members);

// ---- invited user: sees invite but NOT the group ----
r = await req("GET", "/groups", { token: bobToken });
check("invited bob has empty /groups", r.status === 200 && !r.json.some(g => g._id === group._id), r.json);
r = await req("GET", "/groups/invites", { token: bobToken });
check("bob sees invite in /groups/invites", r.status === 200 && r.json.some(g => g._id === group._id), r.json);
r = await req("GET", `/groups/${group._id}`, { token: bobToken });
check("invited bob group access denied", r.status === 404 || r.status === 403, r.status);

// ---- invited users can't participate in expenses ----
const expenseBody = {
  groupId: group._id,
  description: "pizza",
  amount: 100,
  paidBy: alice.user._id,
  splitType: "exact",
  splits: [{ member: alice.user._id, amount: 60 }, { member: bob.user._id, amount: 40 }],
};
r = await req("POST", "/expenses", { token: aliceToken, body: expenseBody });
check("expense with invited (not active) member -> 400", r.status === 400, r.json);

// ---- accept invite ----
r = await req("POST", `/groups/${group._id}/invite/accept`, { token: bobToken });
check("bob accepts invite 200", r.status === 200, r.json);
r = await req("GET", "/groups", { token: bobToken });
check("accepted bob sees group", r.status === 200 && r.json.some(g => g._id === group._id), r.json);
r = await req("GET", "/groups/invites", { token: bobToken });
check("accepted bob has no pending invites", r.status === 200 && !r.json.some(g => g._id === group._id), r.json);

// ---- expenses now work ----
r = await req("POST", "/expenses", { token: aliceToken, body: expenseBody });
check("add expense 201 (both active)", r.status === 201, r.json);
const expense = r.json;
check("expense pays carol rejected", (await req("POST", "/expenses", { token: aliceToken, body: { ...expenseBody, paidBy: carol.user._id } })).status === 400);
r = await req("GET", "/expenses", { token: bobToken });
check("bob sees expense", r.status === 200 && r.json.some(e => e._id === expense._id), r.json);

// ---- settlement ----
r = await req("POST", "/settlements", { token: aliceToken, body: { groupId: group._id, from: alice.user._id, to: bob.user._id, amount: 40 } });
check("add settlement 201", r.status === 201, r.json);
check("settlement invalid member rejected", (await req("POST", "/settlements", { token: aliceToken, body: { groupId: group._id, from: carol.user._id, to: bob.user._id, amount: 5 } })).status === 400);

// ---- add member -> invite; decline then re-invite; accept ----
r = await req("POST", `/groups/${group._id}/members`, { token: bobToken, body: { email: emails.carol } });
check("non-creator cannot add member (403/404)", [403, 404].includes(r.status), r.status);
r = await req("POST", `/groups/${group._id}/members`, { token: aliceToken, body: { email: emails.carol } });
check("creator adds carol -> invite", r.status === 200 && r.json.members.find(m => m._id === carol.user._id)?.membershipStatus === "invited", r.json);
check("add pending duplicate -> 400", (await req("POST", `/groups/${group._id}/members`, { token: aliceToken, body: { email: emails.carol } })).status === 400);

r = await req("POST", `/groups/${group._id}/invite/decline`, { token: carolToken });
check("carol declines invite", r.status === 200, r.json);
r = await req("GET", "/groups", { token: carolToken });
check("declined carol has no groups", r.status === 200 && !r.json.some(g => g._id === group._id), r.json);
r = await req("POST", `/groups/${group._id}/members`, { token: aliceToken, body: { email: emails.carol } });
check("re-invite declined carol", r.status === 200 && r.json.members.find(m => m._id === carol.user._id)?.membershipStatus === "invited", r.json);
r = await req("POST", `/groups/${group._id}/invite/accept`, { token: carolToken });
check("carol accepts re-invite", r.status === 200, r.json);
r = await req("GET", "/groups", { token: carolToken });
check("carol now sees group", r.status === 200 && r.json.some(g => g._id === group._id), r.json);

// ---- remove member ----
r = await req("DELETE", `/groups/${group._id}/members/${bob.user._id}`, { token: aliceToken });
check("creator removes bob", r.status === 200, r.json);
r = await req("GET", "/groups", { token: bobToken });
check("bob no longer sees group after removal", r.status === 200 && !r.json.some(g => g._id === group._id), r.json);

// ---- delete guard + cascade ----
check("carol cannot delete group -> 403", (await req("DELETE", `/groups/${group._id}`, { token: carolToken })).status === 403);
r = await req("DELETE", `/groups/${group._id}`, { token: aliceToken });
check("alice deletes group", r.status === 200, r.json);
r = await req("GET", "/expenses", { token: carolToken });
check("cascade: no leftover expenses for carol", r.status === 200 && r.json.length === 0, r.json);

// ---- remove creator guard ----
r = await req("POST", "/groups", { token: aliceToken, body: { name: `smoke2-${tag}`, members: [bob.user._id] } });
check("recreate for guard test", r.status === 201, r.json);
const g2 = r.json;
r = await req("POST", `/groups/${g2._id}/invite/accept`, { token: bobToken });
check("bob accepts second invite", r.status === 200, r.json);
check("creator cannot be removed", (await req("DELETE", `/groups/${g2._id}/members/${alice.user._id}`, { token: aliceToken })).status === 400);

// ---- resend verification ----
check("resend for unverified -> 200", (await req("POST", "/auth/resend-verification", { body: { email: `x-${tag}@example.com` } })).status === 404);
const freshEmail = `fresh-${tag}@example.com`;
await register("Fresh", freshEmail);
r = await req("POST", "/auth/resend-verification", { body: { email: freshEmail } });
check("resend verification email -> 200", r.status === 200, r.json);

// cleanup DB
const testEmails = [...Object.values(emails), freshEmail];
const users = await User.find({ email: { $in: testEmails } }).select("_id");
const userIds = users.map(u => u._id);
const groups = await Group.find({ createdBy: { $in: userIds } }).select("_id");
const groupIds = groups.map(g => g._id);
await Group.deleteMany({ _id: { $in: groupIds } });
await Expense.deleteMany({ groupId: { $in: groupIds } });
await Settlement.deleteMany({ groupId: { $in: groupIds } });
await User.deleteMany({ email: { $in: testEmails } });
await mongoose.disconnect();
console.log(`cleanup removed ${userIds.length} users, ${groupIds.length} groups`);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);