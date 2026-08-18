import express from 'express';
import adminController from './controllers/admin.controller';
import vehicleController from './controllers/vehicle.controller';
import makeUploader from './libs/utils/uploader';

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
        vehicleController.createNewVehicle
    )
    .post(
        '/vehicle/update/:id', 
        adminController.verifyAdmin,
        makeUploader("vehicles").array("vehicleImages", 5),
        vehicleController.updateChosenVehicle
    );

/** USER **/

export default routerAdmin;