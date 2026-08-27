import {
  ACTIVE_STATUSES,
  AVAILABLE_STATUSES,
  HISTORY_STATUSES,
  LEASE_DISCOUNTS,
  shapeIntoMongooseObjectId,
  UNAVAILABLE_STATUSES,
} from "../libs/config";
import { OrderStatus, OrderTab } from "../libs/enums/order.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Member } from "../libs/types/member";
import { AdminOrderInquiry, AdminOrderUpdateInput, Order, OrderInput, OrderInquiry } from "../libs/types/order";
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

  public async cancelMyOrder(member: Member, id: string): Promise<Order> {
    const orderId = shapeIntoMongooseObjectId(id);

    const order = await this.orderModel.findOne({
      _id: orderId,
      memberId: member._id,
    }).exec();

    if (!order) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    if (order.orderStatus !== OrderStatus.CREATED) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.CANNOT_CANCEL);
    }

    order.orderStatus = OrderStatus.CANCELLED;
    await order.save();

    await this.vehicleModel.updateOne(
      { _id: order.vehicleId },
      { $inc: { vehicleQuantity: 1 } }
    );

    return order as unknown as Order;
  }

  /** BSSR **/

  public async getAllOrdersByAdmin(inquiry: AdminOrderInquiry): Promise<{data: Order[], total: number}> {
    const match: T = {};
    if (inquiry.orderStatus) match.orderStatus = inquiry.orderStatus;
    if (inquiry.search) match.search = { "memberData.memberNick": { $regex: new RegExp(inquiry.search, "i") } }

    const pipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "memberData" } },
      { $unwind: { path: "$memberData", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "vehicles", localField: "vehicleId", foreignField: "_id", as: "vehicleData" } },
      { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },
    ];

    if (inquiry.search) {
      pipeline.push({
        $match: { "memberData.memberNick": { $regex: new RegExp(inquiry.search, "i") } },
      });
    }
    pipeline.push({
      $facet: {
        data: [
          { $skip: (inquiry.page - 1) * inquiry.limit },
          { $limit: inquiry.limit },
          {
            $project: {
              orderStatus: 1, orderLeaseTerm: 1, orderStartDate: 1, orderTotal: 1, createdAt: 1,
              "memberData.memberNick": 1, "memberData.memberPhone": 1,
              "vehicleData.vehicleBrand": 1, "vehicleData.vehicleModel": 1,
            },
          },
        ],
        metaCounter: [{ $count: "total" }],
      },
    });

    const [result] = await this.orderModel.aggregate(pipeline).exec();

    return {
      data: (result?.data ?? []) as Order[],
      total: result?.metaCounter[0]?.total ?? 0
    } ;
  }

  public async updateOrderByAdmin(input: AdminOrderUpdateInput): Promise<Order> {
    const orderId = shapeIntoMongooseObjectId(input.orderId);
    const newStatus = input.orderStatus;

    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    const oldStatus = order.orderStatus;

    order.orderStatus = newStatus;
    await order.save();

    const wasUnavailable = UNAVAILABLE_STATUSES.includes(oldStatus as OrderStatus);
    const isNowAvailable = AVAILABLE_STATUSES.includes(newStatus);
    const wasAvailable = AVAILABLE_STATUSES.includes(oldStatus as OrderStatus);
    const isNowUnavailable = UNAVAILABLE_STATUSES.includes(newStatus);
      
    if (wasUnavailable && isNowAvailable) {
      await this.vehicleModel.updateOne(
        { _id: order.vehicleId },
        { $inc: { vehicleQuantity: 1 } }
      );
    }
    if (wasAvailable && isNowUnavailable) {
      await this.vehicleModel.updateOne(
        { _id: order.vehicleId },
        { $inc: { vehicleQuantity: -1 } }
      );
    }
      
    if (!order) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
    return order as unknown as Order;
  }
}

export default OrderService;
