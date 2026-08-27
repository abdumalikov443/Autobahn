import { MemberType, MemberStatus } from "../enums/member.enum";
import { ObjectId, Types } from "mongoose";
import { Request } from "express";
import { Session } from "express-session";

export interface Member {
    _id: Types.ObjectId;
    memberType: MemberType;
    memberStatus: MemberStatus;
    memberNick: string;
    memberPhone: string;
    memberPassword?: string;
    memberAddress?: string;
    memberDesc?: string;
    memberImage?: string;
    createdAt: Date;
    updatedAt: Date;
}


export interface MemberInput {
    memberType?: MemberType;
    memberStatus?: MemberStatus;
    memberNick: string;
    memberPhone: string;
    memberPassword: string;
    memberAddress?: string;
    memberDesc?: string;
    memberImage?: string;
}


/** Admin users table: server-side paging + filtering. */
export interface AdminUserInquiry {
    page: number;
    limit: number;
    memberStatus?: MemberStatus;
    lease?: "withLease" | "noLease";
    search?: string;
}


export interface LoginInput {
    memberNick: string;
    memberPassword: string;
}


export interface MemberUpdateInput {
    _id: ObjectId;
    memberType?: MemberType;
    memberStatus?: MemberStatus;
    memberNick?: string;
    memberPhone?: string;
    memberPassword?: string;
    memberAddress?: string;
    memberDesc?: string;
    memberImage?: string;
}


export interface MemberRequest extends Request {
    member: Member;
    file: Express.Multer.File;
    files: Express.Multer.File[];
}


export interface AdminRequest extends Request {
    member: Member;
    session: Session & {member: Member};
    file: Express.Multer.File;
    files: Express.Multer.File[];
}