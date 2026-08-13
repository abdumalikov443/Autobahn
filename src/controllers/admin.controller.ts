import { Request, Response } from 'express';
import { T } from '../libs/types/common';

const adminController: T = {};

adminController.goHome = (req: Request, res: Response) => {
    
    try { 
        res.send("Home Page");
    } catch (err) {
        console.log("Error, goHome:", err);
    }
};


adminController.getLogin = (req: Request, res: Response) => {
    
    try { 
        res.send("Login Page");
    } catch (err) {
        console.log("Error, getLogin:", err);
    }
};


adminController.getSignup = (req: Request, res: Response) => {
    
    try { 
        res.send("Signup Page");
    } catch (err) {
        console.log("Error, getSignup:", err);
    }
};


adminController.processLogin = (req: Request, res: Response) => {
    try {
        console.log("processLogin");
        res.send("DONE");
    } catch (err) {
        console.log("Error, processLogin:", err);
    }
};


adminController.processSignup = (req: Request, res: Response) => {
    try {
        console.log("processLoprocessSignUpgin");
        res.send("DONE");
    } catch (err) {
        console.log("Error, processSignUp:", err);
    }
};


export default adminController;