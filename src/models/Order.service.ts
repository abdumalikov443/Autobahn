import {
  ACTIVE_STATUSES,
  HISTORY_STATUSES,
  LEASE_DISCOUNTS,
  shapeIntoMongooseObjectId,
} from "../libs/config";
import { OrderStatus, OrderTab } from "../libs/enums/order.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Member } from "../libs/types/member";
import { Order, OrderInput, OrderInquiry } from "../libs/types/order";
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

  public async getMyOrders(
    member: Member,
    inquiry: OrderInquiry,
  ): Promise<Order[]> {
    const memberId = shapeIntoMongooseObjectId(member._id);
    const statuses =
      inquiry.tab === OrderTab.HISTORY ? HISTORY_STATUSES : ACTIVE_STATUSES;

    const match: T = { memberId, orderStatus: { $in: statuses } };

    const result = await this.orderModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        { $skip: (inquiry.page - 1) * inquiry.limit },
        { $limit: inquiry.limit },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicleId",
            foreignField: "_id",
            as: "vehicleData",
          },
        },
        { $unwind: "$vehicleData" },
      ])
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    return result as unknown as Order[];
  }

  public async getMyOrdersOverview(member: Member) {
    const memberId = shapeIntoMongooseObjectId(member._id);

    const [stats] = await this.orderModel
      .aggregate([
        { $match: { memberId } },
        {
          $facet: {
            activeLeases: [
              { $match: { orderStatus: { $in: ACTIVE_STATUSES } } },
              { $count: "count" },
            ],
            completedLeases: [
              { $match: { orderStatus: OrderStatus.FINISHED } },
              { $count: "count" },
            ],
            monthlyTotal: [
              { $match: { orderStatus: { $in: ACTIVE_STATUSES } } },
              {
                $group: {
                  _id: null,
                  // orderTotal = monthlyRate * leaseTerm bo'lgani uchun, monthlyRate'ni qayta chiqarib olamiz
                  total: {
                    $sum: { $divide: ["$orderTotal", "$orderLeaseTerm"] },
                  },
                },
              },
            ],
          },
        },
      ])
      .exec();

    return {
      activeLeases: stats.activeLeases[0]?.count ?? 0,
      completedLeases: stats.completedLeases[0]?.count ?? 0,
      monthlyTotal: Math.round(stats.monthlyTotal[0]?.total ?? 0),
    };
  }
}

export default OrderService;
