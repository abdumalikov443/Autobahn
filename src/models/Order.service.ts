import { shapeIntoMongooseObjectId } from "../libs/config";
import { Member } from "../libs/types/member";
import { Order, OrderInput } from "../libs/types/order";
import OrderModel from "../schema/Order.model";

class OrderService {
    private readonly orderModel;

    constructor() {
        this.orderModel = OrderModel;
    }

    public async createOrder(member: Member, input: OrderInput): Promise<Order> {
        const memberId = shapeIntoMongooseObjectId(member._id);
        return '' as unknown as Order;
    }
};

export default OrderService;