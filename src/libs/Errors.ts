export enum HttpCode{
    OK = 200,
    CREATED = 201,
    NOT_MODIFIED = 304,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500
}

export enum Message {
    SOMETHING_WENT_WRONG = "Something went wrong!",
    NO_DATA_FOUND = "No data found",
    CREATE_FAILED = "Create failed!",
    UPDATE_FAILED = "Update failed!",

    NO_MEMBER_NICK = "No member with that membernick!",
    TOKEN_CREATION_FAILED = "Token creation error!",
    USED_NICK_PHONE = "You are inserting already used nick and phone!",
    BLOCKED_USER = "You have been blocked, contact with admin!",
    WRONG_PASSWORD = "Wrong password, try again please!",
    NOT_AUTHENTICATED = "You are not authenticated, please login first!",

    INVALID_DATE = "Please insert a valid date!",
    DATE_IN_PAST = "You are inserting a past date, please choose upcoming dates!",
    OUT_OF_STOCK = "This vehicle is Out Of Stock",
    INVALID_QUANTITY = "Quantity must be at least 1!",
    CANNOT_CANCEL = "You cannot cancel this order, please contact with admin!"
}

class Errors extends Error {
    public code: HttpCode;
    public message: Message;

    static standard = {
        code: HttpCode.INTERNAL_SERVER_ERROR,
        message: Message.SOMETHING_WENT_WRONG
    };

    constructor(statusCode: HttpCode, statusMessage: Message) {
        super();
        this.code = statusCode;
        this.message = statusMessage;
    }
}

export default Errors;