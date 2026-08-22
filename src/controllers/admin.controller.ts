import { NextFunction, Request, Response } from 'express';
import { T } from '../libs/types/common';
import { AdminRequest, MemberInput, LoginInput } from '../libs/types/member';
import { MemberType } from '../libs/enums/member.enum';
import MemberService from '../models/Member.service';
import Errors, { HttpCode, Message } from '../libs/Errors';

const memberService = new MemberService();

const adminController: T = {};

adminController.goHome = (req: Request, res: Response) => {

    try {
        res.render("index", { authView: "login", error: null })
    } catch (err) {
        console.log("Error, goHome:", err);
        res.redirect("/admin");
    }
};


adminController.getSignup = (req: Request, res: Response) => {

    try {
        res.render("index", { authView: "signup", error: null });
    } catch (err) {
        console.log("Error, getSignup:", err);
        res.redirect("/admin");
    }
};


adminController.getLogin = (req: Request, res: Response) => {

    try {
        console.log("getLogin");

        res.render("index", { authView: "login", error: null });
    } catch (err) {
        console.log("Error, getLogin:", err);
        res.redirect("/admin");
    }
};



adminController.processSignup = async (req: AdminRequest, res: Response) => {
    try {
        console.log("processSignup");
        const file = req.file;
        if (!file) throw new Errors(HttpCode.BAD_REQUEST, Message.SOMETHING_WENT_WRONG);

        const newMember: MemberInput = req.body;
        newMember.memberImage = file?.path.replace(/\\/g, "/");
        newMember.memberType = MemberType.ADMIN;

        const result = await memberService.processSignup(newMember);

        // Session Auth
        req.session.member = result;
        req.session.save(function () {
            res.redirect("/admin/vehicle/all");
        });
    } catch (err) {
        console.log("Error, processSignUp:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(`<script> alert("${message}"); window.location.replace('/admin/signup') </script>`)
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
            res.redirect("/admin/vehicle/all")
        });
    } catch (err) {
        console.log("Error, processLogin:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(`<script> alert("${message}"); window.location.replace('/admin/login') </script>`);
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


adminController.getUsers = async (req: Request, res: Response) => {
    try {
        console.log("getUsers");
        const result = await memberService.getUsers();

        res.render("users", { users: result });
    } catch (err) {
        console.log("Error, getUsers:", err);
        res.redirect("/admin/login");
    }
};


adminController.updateChosenUser = async (req: Request, res: Response) => {
    try {
        console.log("updateChosenUser");
        const result = await memberService.updateChosenUser(req.body);

        res.status(HttpCode.OK).json({data: result});
    } catch (err) {
        console.log("Error, updateChosenUser:", err);
        if(err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
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