import express from 'express';
import uploader from "./libs/utils/uploader";
import memberController from './controllers/member.controller';
import vehicleController from './controllers/vehicle.controller';
import reviewController from './controllers/review.controller';
import orderController from './controllers/order.controller';
const router = express.Router();

/** MEMBER **/
router
    .post('/member/login', memberController.login)
    .post('/member/signup', memberController.signup)
    .post('/member/logout', memberController.verifyAuth, memberController.logout)
    .get('/member/detail', memberController.verifyAuth, memberController.getMemberDetail)
    .post('/member/update', memberController.verifyAuth, uploader('members').single('memberImage'), memberController.updateMember);


/** VEHICLES **/
router
    .get('/vehicle/top-vehicles', vehicleController.getTopVehicles)
    .get('/vehicle/all', vehicleController.getVehicles)
    .get('/vehicle/:id', memberController.retrieveAuth, vehicleController.getVehicle)


/** REVIEWS **/
router
    .post('/review/create', memberController.verifyAuth, reviewController.createNewReview);


/** ORDERS **/
router
    .post('/order/create', memberController.verifyAuth, orderController.createOrder)
    .get('/order/all', memberController.verifyAuth, orderController.getMyOrders)
    .get('/order/all/overview', memberController.verifyAuth, orderController.getMyOrdersOverview)
    .post('/order/cancel/:id', memberController.verifyAuth, orderController.cancelMyOrder);


export default router;