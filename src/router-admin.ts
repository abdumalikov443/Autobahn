import express from 'express';
import adminController from './controllers/admin.controller';
import vehicleController from './controllers/vehicle.controller';
import makeUploader from './libs/utils/uploader';
import reviewController from './controllers/review.controller';

const routerAdmin = express.Router();

/** ADMIN **/
routerAdmin.get('/', adminController.goHome);

routerAdmin
    .get('/login', adminController.getLogin)
    .post('/login', adminController.processLogin);

routerAdmin
    .get('/signup', adminController.getSignup)
    .post(
        '/signup', 
        makeUploader("members").single("memberImage"),
        adminController.processSignup
    );

routerAdmin
    .get('/check', adminController.checkAuthSession)
    .get('/logout', adminController.logout);

/** VEHICLE **/
routerAdmin
    .get(
        '/vehicle/all', 
        adminController.verifyAdmin, 
        vehicleController.getAllVehicles
    )
    .post(
        '/vehicle/create', 
        adminController.verifyAdmin,
        makeUploader("vehicles").array("vehicleImages", 5),
        vehicleController.createNewVehicle
    )
    .post(
        '/vehicle/update/:id', 
        adminController.verifyAdmin,
        vehicleController.updateChosenVehicle
    );

/** REVIEW **/
routerAdmin
    .get(
        '/review/all', 
        adminController.verifyAdmin, 
        reviewController.getAllReviews
    )

/** USER **/
routerAdmin
    .get(
        "/user/all", 
        adminController.verifyAdmin, 
        adminController.getUsers
    )
    .post(
        "/user/edit",
        adminController.verifyAdmin,
        adminController.updateChosenUser
    );

export default routerAdmin;