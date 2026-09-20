import express from "express";

import { getGroups, createGroup, deleteGroup, addMember, removeMember, getGroupById, getInvites, acceptInvite, declineInvite } from "../controllers/groupController.js";
import { authRequired, requireVerified } from "../middleware/auth.js";

const router = express.Router()

router.post('/groups', authRequired, requireVerified, createGroup)
router.get('/groups', authRequired, requireVerified, getGroups)
router.get('/groups/invites', authRequired, requireVerified, getInvites)
router.get('/groups/:id', authRequired, requireVerified, getGroupById)
router.post('/groups/:id/invite/accept', authRequired, requireVerified, acceptInvite)
router.post('/groups/:id/invite/decline', authRequired, requireVerified, declineInvite)
router.post('/groups/:id/members', authRequired, requireVerified, addMember)
router.delete('/groups/:id/members/:memberId', authRequired, requireVerified, removeMember)
router.delete('/groups/:id', authRequired, requireVerified, deleteGroup)

export default router;