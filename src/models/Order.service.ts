import { LEASE_DISCOUNTS, shapeIntoMongooseObjectId } from "../libs/config";
import { OrderStatus } from "../libs/enums/order.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { Member } from "../libs/types/member";
import { Order, OrderInput } from "../libs/types/order";
import OrderModel from "../schema/Order.model";
import VehicleModel from "../schema/Vehicle.model";

class OrderService {
  private readonly orderModel;
  private readonly vehicleModel;

  constructor() {
    this.orderModel = OrderModel;
    this.vehicleModel = VehicleModel;
  }

  public async createOrder(member: Member, input: OrderInput): Promise<Order> {
    const vehicle = await this.vehicleModel
      .findOneAndUpdate(
        { _id: input.vehicleId, vehicleQuantity: { $gt: 0 } },
        { $inc: { vehicleQuantity: -1 } },
        { new: false },
      )
      .exec();
    if (!vehicle) throw new Errors(HttpCode.BAD_REQUEST, Message.OUT_OF_STOCK);

    const discount = LEASE_DISCOUNTS[input.orderLeaseTerm];
    const monthlyRate = vehicle.vehiclePrice * (1 - discount);
    const orderTotal = Math.round(monthlyRate * input.orderLeaseTerm);

    const startDate = new Date(input.orderStartDate);
    if (isNaN(startDate.getTime())) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_DATE);
    }
    if (startDate < new Date()) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.DATE_IN_PAST);
    }

    const newOrder = {
      memberId: member._id,
      vehicleId: vehicle._id,
      orderLeaseTerm: input.orderLeaseTerm,
      orderDeliveryLocation: input.orderDeliveryLocation,
      orderStartDate: startDate,
      orderTotal,
      orderStatus: OrderStatus.CREATED,
    };
    try {
      return (await this.orderModel.create(newOrder)) as unknown as Order;
    } catch (err) {
      await this.vehicleModel.updateOne(
        { _id: vehicle._id },
        { $inc: { vehicleQuantity: 1 } },
      );
      console.log("Error, model: createOrder:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }
}

export default OrderService;
