import { NextFunction, Request, Response } from 'express';
import { T } from '../libs/types/common';
import { AdminRequest, MemberInput, LoginInput } from '../libs/types/member';
import { MemberType } from '../libs/enums/member.enum';
import MemberService from '../models/Member.service';
import Errors, { Message } from '../libs/Errors';

const memberService = new MemberService();

const adminController: T = {};

adminController.goHome = (req: Request, res: Response) => {

    try {
        res.render("index")
    } catch (err) {
        console.log("Error, goHome:", err);
        res.redirect("/admin");
    }
};


adminController.getSignup = (req: Request, res: Response) => {

    try {
        res.render("users");
    } catch (err) {
        console.log("Error, getSignup:", err);
        res.redirect("/admin");
    }
};


adminController.getLogin = (req: Request, res: Response) => {

    try {
        console.log("getLogin");

        res.render("vehicles");
    } catch (err) {
        console.log("Error, getLogin:", err);
        res.redirect("/admin");
    }
};



adminController.processSignup = async (req: AdminRequest, res: Response) => {
    try {
        console.log("processSignup");
        console.log("req.body: ", req.body);

        const newMember: MemberInput = req.body;
        newMember.memberType = MemberType.ADMIN;

        const result = await memberService.processSignup(newMember);

        // Session Auth
        req.session.member = result;
        req.session.save(function () {
            res.send(result);
        });
    } catch (err) {
        console.log("Error, processSignUp:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(`<script> alert("${message}"); window.location.replace('admin/login) </script>`)
    }
};


adminController.processLogin = async (req: AdminRequest, res: Response) => {
    try {
        console.log("processLogin");
        console.log("req.body: ", req.body);

        const member: LoginInput = req.body;
        const result = await memberService.processLogin(member);

        // Session Auth
        req.session.member = result;
        req.session.save(function () {
            res.send(result);
        });
    } catch (err) {
        console.log("Error, processLogin:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(`<script> alert("${message}"); window.location.replace('admin/login) </script>`);
    }
};


adminController.logout = async (req: AdminRequest, res: Response) => {
    try {
        console.log("logout");
        req.session.destroy(function() {
            res.redirect("/admin");
        });
    } catch (err) {
        console.log("Error, logout:", err);
        res.redirect("/admin");
    }
};


adminController.checkAuthSession = async (req: AdminRequest, res: Response) => {
    try {
        console.log("checkAuthSession");
        if (req.session?.member) {
            console.log("memberNick: ", req.session.member.memberNick);
            res.send(`<script> alert("${req.session.member.memberNick}") </script>`)
        } else res.send(`<script> alert("${Message.NOT_AUTHENTICAED}") </script>`);
    } catch (err) {
        console.log("Error, checkAuthSession:", err);
        res.send(err);
    }
};


adminController.verifyAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
    if (req.session?.member?.memberType === MemberType.ADMIN) {
        req.member = req.session.member;
        next(); // if we don't use next() here the server will be down
    } else {
        const message = Message.NOT_AUTHENTICAED;
        res.send(`<script> alert("${message}"); window.location.replace('/admin/login'); </script>`);
    }
};

export default adminController;