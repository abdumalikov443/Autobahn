import bcrypt from "bcryptjs";
import { MemberStatus, MemberType } from "../libs/enums/member.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { AdminUserInquiry, Member, MemberInput, LoginInput, MemberUpdateInput } from "../libs/types/member";
import { T } from "../libs/types/common";
import MemberModel from "../schema/Member.model";
import { ACTIVE_STATUSES, shapeIntoMongooseObjectId } from "../libs/config";

class MemberService {
    private readonly memberModel;

    constructor() {
        this.memberModel = MemberModel;
    }

    /** SPA **/
    public async signup(input: MemberInput): Promise<Member> {
        const salt = await bcrypt.genSalt();
        input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

        try {
            const result = await this.memberModel.create(input);
            result.memberPassword = "";
            return result.toJSON() as unknown as Member;
        } catch (err) {
            console.error('Error, model:signup', err);
            throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
        }
    }

    public async login(input: LoginInput): Promise<Member> {
        const member = await this.memberModel
            .findOne(
                { memberNick: input.memberNick, memberStatus: {$ne: MemberStatus.DELETE} },
                { memberNick: 1, memberPassword: 1, memberStatus: 1 }
            ).exec();

        if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);
        if(member.memberStatus === MemberStatus.BLOCK) {
            throw new Errors(HttpCode.FORBIDDEN, Message.BLOCKED_USER);
        }

        const isMatch = await bcrypt.compare(
            input.memberPassword, member.memberPassword
        );

        if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

        const result = await this.memberModel.findById(member._id).exec();
        console.log("result: ", result); //@ts-ignore
        return result.toJSON() as unknown as Member;
    }

    public async getMemberDetail(member: Member): Promise<Member> {
        const memberId = shapeIntoMongooseObjectId(member._id);
        const result = await this.memberModel
            .findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
            .exec();
        if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
        
        return result as unknown as Member;
    }

    public async updateMember(member: Member, input: MemberUpdateInput): Promise<Member> {
        const memberId = shapeIntoMongooseObjectId(member._id);
        const result = await this.memberModel
            .findOneAndUpdate({_id: memberId}, input, {new: true})
            .exec();
        if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

        return result as unknown as Member;
    }


    /** BSSR **/
    public async processSignup(input: MemberInput): Promise<Member> {
        const exist = await this.memberModel
            .findOne({ memberType: MemberType.ADMIN })
            .exec();

        if (exist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

        const salt = await bcrypt.genSalt();
        input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

        try {
            const result = await this.memberModel.create(input);
            result.memberPassword = "";
            return result.toJSON() as unknown as Member;
        } catch (err) {
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
        }
    }

    public async processLogin(input: LoginInput): Promise<Member> {
        const member = await this.memberModel
            .findOne(
                { memberNick: input.memberNick, memberType: MemberType.ADMIN },
                { memberNick: 1, memberPassword: 1 }
            ).exec();
            console.log(member);

        if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

        // const isMatch = input.memberPassword === member.memberPassword;
        const isMatch = await bcrypt.compare(input.memberPassword, member.memberPassword);

        if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

        return await this.memberModel.findById(member._id).exec() as unknown as Member;
    }

    public async getUsers(
        inquiry: AdminUserInquiry
    ): Promise<{ data: Member[]; total: number }> {
        const match: T = { memberType: MemberType.USER };
        if (inquiry.memberStatus) match.memberStatus = inquiry.memberStatus;
        if (inquiry.search) {
            const rgx = new RegExp(inquiry.search, "i");
            match.$or = [{ memberNick: { $regex: rgx } }, { memberPhone: { $regex: rgx } }];
        }

        // The lease join runs BEFORE $facet so an activeLeases filter can narrow the
        // set that metaCounter counts — otherwise the pager would report a total the
        // filtered rows never add up to.
        const pipeline: any[] = [
            { $match: match },
            {
                $lookup: {
                    from: "orders",
                    let: { memberId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$memberId", "$$memberId"] },
                                orderStatus: { $in: ACTIVE_STATUSES },
                            },
                        },
                        { $count: "count" },
                    ],
                    as: "activeOrders",
                },
            },
            {
                $addFields: {
                    activeLeases: {
                        $ifNull: [{ $arrayElemAt: ["$activeOrders.count", 0] }, 0],
                    },
                },
            },
        ];

        if (inquiry.lease === "withLease") pipeline.push({ $match: { activeLeases: { $gt: 0 } } });
        if (inquiry.lease === "noLease") pipeline.push({ $match: { activeLeases: 0 } });

        pipeline.push({
            $facet: {
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: (inquiry.page - 1) * inquiry.limit },
                    { $limit: inquiry.limit },
                    // Aggregation bypasses `select: false`, so memberPassword goes out here.
                    { $project: { activeOrders: 0, memberPassword: 0 } },
                ],
                metaCounter: [{ $count: "total" }],
            },
        });

        const [result] = await this.memberModel.aggregate(pipeline).exec();

        return {
            data: (result?.data ?? []) as Member[],
            total: result?.metaCounter[0]?.total ?? 0,
        };
    }

    public async updateChosenUser(input: MemberUpdateInput): Promise<Member> {
        // _id must stay out of the $set payload — Mongo rejects updates to immutable fields.
        const { _id, ...changes } = input;
        const memberId = shapeIntoMongooseObjectId(_id);

        const result = await this.memberModel
            .findOneAndUpdate({ _id: memberId }, changes, { new: true })
            .exec();

        if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
        return result as unknown as Member;
    }
}

export default MemberService;