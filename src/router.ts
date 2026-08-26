import express from 'express';
import memberController from './controllers/member.controller';
const router = express.Router();

/** MEMBER **/
router
    .post('/member/login', memberController.login)
    .post('/member/signup', memberController.signup)
    .post('/member/logout', memberController.verifyAuth, memberController.logout)
    .get('/member/detail', memberController.verifyAuth);

export default router;