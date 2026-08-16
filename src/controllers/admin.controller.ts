import { Request, Response } from 'express';
import { T } from '../libs/types/common';
import { MemberInput, LoginInput } from '../libs/types/member';
import { MemberType } from '../libs/enums/member.enum';
import MemberService from '../models/Member.service';

const memberService = new MemberService();

const adminController: T = {};

adminController.goHome = (req: Request, res: Response) => {
    
    try { 
        res.send("Home Page");
    } catch (err) {
        console.log("Error, goHome:", err);
    }
};


adminController.getSignup = (req: Request, res: Response) => {
    
    try { 
        res.send("Signup Page");
    } catch (err) {
        console.log("Error, getSignup:", err);
    }
};


adminController.getLogin = (req: Request, res: Response) => {
    
    try { 
        console.log("getLogin");

        res.send("Login Page");
    } catch (err) {
        console.log("Error, getLogin:", err);
    }
};



adminController.processSignup = async (req: Request, res: Response) => {
    try {
        console.log("processSignup");
        console.log("req.body: ", req.body);
        
        const newMember: MemberInput = req.body;
        newMember.memberType = MemberType.ADMIN;

        const result = await memberService.processSignup(newMember);
        // Session Auth
        
        res.send(result);
    } catch (err) {
        console.log("Error, processSignUp:", err);
        res.send(err);
    }
};


adminController.processLogin = async (req: Request, res: Response) => {
    try {
        console.log("processLogin");
        console.log("req.body: ", req.body);

        const member: LoginInput = req.body;
        const result = await memberService.processLogin(member);
        // Session Auth
        
        res.send(result);
    } catch (err) {
        console.log("Error, processLogin:", err);
    }
};

export default adminController;