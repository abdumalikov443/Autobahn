import express from 'express';
import adminController from './controllers/admin.controller';
import vehicleController from './controllers/vehicle.controller';

const routerAdmin = express.Router();

/** ADMIN **/
routerAdmin.get('/', adminController.goHome);

routerAdmin
    .get('/login', adminController.getLogin)
    .post('/login', adminController.processLogin);

routerAdmin
    .get('/signup', adminController.getSignup)
    .post('/signup', adminController.processSignup);

routerAdmin
    .get('/check', adminController.checkAuthSession)
    .get('/logout', adminController.logout);

/** VEHICLE **/
routerAdmin
    .get('/vehicle/all', adminController.verifyAdmin, vehicleController.getAllVehicles)
    .post('/vehicle/create', adminController.verifyAdmin, vehicleController.createNewVehicle)
    .post('/vehicle/update/:id', adminController.verifyAdmin, vehicleController.updateChosenVehicle);

/** USER **/

export default routerAdmin;