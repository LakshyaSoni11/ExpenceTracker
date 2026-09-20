import mongoose from "mongoose";
import "dotenv/config";
import { io } from "socket.io-client";

const BASE = "http://localhost:5000/api";
const WS = "http://localhost:5000";
const tag = Date.now().toString(36);
const emails = {
  alice: `sock-alice-${tag}@example.com`,
  bob: `sock-bob-${tag}@example.com`,
};

let failures = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`PASS  ${name}`);
  else { failures++; console.log(`FAIL  ${name}${extra ? "  -> " + JSON.stringify(extra) : ""}`); }
};

async function req(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const register = async (name, email) => {
  const r = await req("POST", "/auth/register", { body: { name, email, password: "password123" } });
  return { status: r.status, token: r.json.token, user: r.json.user };
};

const waitFor = (socket, event, ms = 5000) =>
  new Promise((resolve) => {
    const t = setTimeout(() => { socket.off(event); resolve(null); }, ms);
    socket.once(event, (data) => { clearTimeout(t); resolve(data); });
  });

try { await mongoose.connect(process.env.MONGO_URI, { connectTimeoutMS: 20000 }); }
catch (e) { console.log("DB connect failed:", e.message); process.exit(1); }
const { default: User } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/User.js");
const { default: Group } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Group.js");
const { default: Expense } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Expense.js");
const { default: Settlement } = await import("file:///D:/Fittus/ExpenceTracker/backend/models/Settlement.js");

const alice = await register("Sock Alice", emails.alice);
const bob = await register("Sock Bob", emails.bob);

const verify = async (email) => {
  const doc = await User.findOne({ email }).select("+verificationToken");
  const r = await req("POST", "/auth/verify-email", { body: { token: doc.verificationToken } });
  return r.json.token;
};
const aliceToken = await verify(emails.alice);
const bobToken = await verify(emails.bob);

// connect sockets with JWT auth
const sockA = io(WS, { auth: { token: aliceToken }, transports: ["websocket"] });
const sockB = io(WS, { auth: { token: bobToken }, transports: ["websocket"] });
await Promise.all([
  new Promise((res) => sockA.on("connect", res)),
  new Promise((res) => sockB.on("connect", res)),
]);
check("both sockets connect (JWT handshake)", sockA.connected && sockB.connected);

const invP = waitFor(sockB, "invite:new");
const createdP = waitFor(sockA, "group:created");
const r = await req("POST", "/groups", { token: aliceToken, body: { name: `sockg-${tag}`, members: [bob.user._id] } });
check("alice creates group 201", r.status === 201, r.json);
const groupId = r.json._id;

const inviteEvt = await invP;
check("bob socket got invite:new", inviteEvt && String(inviteEvt.groupId) === String(groupId) && inviteEvt.groupName === `sockg-${tag}`, inviteEvt);
const createdEvt = await createdP;
check("alice socket got group:created", createdEvt && String(createdEvt.groupId) === String(groupId), createdEvt);

// bob accepts -> alice gets member-changed; alice adds expense -> bob gets expense:added
const memberChangedP = waitFor(sockA, "group:member-changed");
await req("POST", `/groups/${groupId}/invite/accept`, { token: bobToken });
const mc = await memberChangedP;
check("alice socket got group:member-changed after accept", mc && String(mc.groupId) === String(groupId), mc);

const expenseP = waitFor(sockB, "expense:added");
await req("POST", "/expenses", {
  token: aliceToken,
  body: {
    groupId,
    description: "dinner",
    amount: 80,
    paidBy: alice.user._id,
    splitType: "equal",
    splits: [{ member: alice.user._id, amount: 40 }, { member: bob.user._id, amount: 40 }],
  },
});
const evt = await expenseP;
check("bob socket got expense:added", evt && String(evt.groupId) === String(groupId) && evt.description === "dinner", evt);

// cleanup
sockA.close();
sockB.close();
const users = await User.find({ email: { $in: Object.values(emails) } }).select("_id");
const userIds = users.map(u => u._id);
const groups = await Group.find({ createdBy: { $in: userIds } }).select("_id");
const groupIds = groups.map(g => g._id);
await Group.deleteMany({ _id: { $in: groupIds } });
await Expense.deleteMany({ groupId: { $in: groupIds } });
await Settlement.deleteMany({ groupId: { $in: groupIds } });
await User.deleteMany({ email: { $in: Object.values(emails) } });
await mongoose.disconnect();

console.log(failures === 0 ? "\nSOCKET TESTS PASSED" : `\n${failures} SOCKET TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);