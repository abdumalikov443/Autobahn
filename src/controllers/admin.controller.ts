import { NextFunction, Request, Response } from 'express';
import { T } from '../libs/types/common';
import { AdminRequest, AdminUserInquiry, MemberInput, LoginInput } from '../libs/types/member';
import { MemberStatus, MemberType } from '../libs/enums/member.enum';
import MemberService from '../models/Member.service';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { wantsJson } from '../libs/config';

const memberService = new MemberService();

const adminController: T = {};

/** Where a signed-in admin belongs; the auth screen is only for signed-out visitors. */
const ADMIN_HOME = "/admin/vehicle/all";

const isSignedIn = (req: Request): boolean =>
    (req as AdminRequest).session?.member?.memberType === MemberType.ADMIN;


adminController.goHome = (req: Request, res: Response) => {

    try {
        // Already signed in? The auth screen is off-limits until logout.
        if (isSignedIn(req)) return res.redirect(ADMIN_HOME);

        res.render("index", { authView: "login", error: null, page: "auth" })
    } catch (err) {
        console.log("Error, goHome:", err);
        res.redirect("/admin");
    }
};


adminController.getSignup = (req: Request, res: Response) => {

    try {
        if (isSignedIn(req)) return res.redirect(ADMIN_HOME);

        res.render("index", { authView: "signup", error: null, page: "auth" });
    } catch (err) {
        console.log("Error, getSignup:", err);
        res.redirect("/admin");
    }
};


adminController.getLogin = (req: Request, res: Response) => {

    try {
        console.log("getLogin");
        if (isSignedIn(req)) return res.redirect(ADMIN_HOME);

        res.render("index", { authView: "login", error: null, page: "auth" });
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
            res.redirect(ADMIN_HOME + "?notice=signup");
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
            res.redirect(ADMIN_HOME + "?notice=login");
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
            res.redirect("/admin?notice=logout");
        });
    } catch (err) {
        console.log("Error, logout:", err);
        res.redirect("/admin");
    }
};


/**
 * Serves the browser the EJS page, and that page's fetch() the paginated rows.
 * Query params (JSON mode): page, limit, memberStatus, search.
 */
adminController.getUsers = async (req: Request, res: Response) => {
    try {
        console.log("getUsers");
        if (!wantsJson(req)) return res.render("users", { page: "users" });

        const { page, limit, memberStatus, lease, search } = req.query;
        const inquiry: AdminUserInquiry = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            memberStatus: memberStatus ? (memberStatus as MemberStatus) : undefined,
            lease: lease === "withLease" || lease === "noLease" ? lease : undefined, // whitelist
            search: search ? String(search) : undefined,
        };

        const result = await memberService.getUsers(inquiry);
        res.status(HttpCode.OK).json({ data: result });
    } catch (err) {
        console.log("Error, getUsers:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
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
        } else res.send(`<script> alert("${Message.NOT_AUTHENTICATED}") </script>`);
    } catch (err) {
        console.log("Error, checkAuthSession:", err);
        res.send(err);
    }
};


adminController.verifyAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
    if (req.session?.member?.memberType === MemberType.ADMIN) {
        req.member = req.session.member;
        next(); // if we don't use next() here the server will be down
    } else if (wantsJson(req)) {
        // A fetch() caller needs a real 401 + JSON; the HTML alert below would
        // arrive as a string where the page expects a parsable body.
        res.status(HttpCode.UNAUTHORIZED).json({
            code: HttpCode.UNAUTHORIZED,
            message: Message.NOT_AUTHENTICATED,
        });
    } else {
        const message = Message.NOT_AUTHENTICATED;
        res.send(`<script> alert("${message}"); window.location.replace('/admin/login'); </script>`);
    }
};

export default adminController;