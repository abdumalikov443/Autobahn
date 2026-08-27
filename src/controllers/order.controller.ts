import { T } from "../libs/types/common";
import { AdminRequest, MemberRequest } from "../libs/types/member";
import { Response } from "express";
import Errors, { HttpCode } from "../libs/Errors";
import OrderService from "../models/Order.service";
import { AdminOrderInquiry, AdminOrderUpdateInput, OrderInquiry } from "../libs/types/order";
import { OrderStatus, OrderTab } from "../libs/enums/order.enum";

const orderService = new OrderService();
const orderController: T = {};



orderController.createOrder = async (req: MemberRequest, res: Response) => {
  try {
    console.log("createOrder");
    const result = await orderService.createOrder(req.member, req.body);

    res.status(HttpCode.CREATED).json({ data: result });
  } catch (err) {
    console.log("Error, createOrder:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.getMyOrders = async (req: MemberRequest, res: Response) => {
  try {
    console.log("getMyOrders");
    const { page, limit, tab } = req.query;
    const inquiry: OrderInquiry = {
      page: Number(page) || 1,
      limit: Number(limit) || 5,
      tab: tab === OrderTab.HISTORY ? OrderTab.HISTORY : OrderTab.ACTIVE, // whitelist
    };

    const result = await orderService.getMyOrders(req.member, inquiry);
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, getMyOrders:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.getMyOrdersOverview = async (req: MemberRequest, res: Response) => {
  try {
    console.log("getMyOrdersOverview");
    const result = await orderService.getMyOrdersOverview(req.member);
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, getMyOrdersOverview:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.cancelMyOrder = async (req: MemberRequest, res: Response) => {
  try {
    console.log("cancelMyOrder");
    const { id } = req.params;
    const result = await orderService.cancelMyOrder(req.member, id);
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, cancelMyOrder:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

/** BSSR **/
orderController.getAllOrdersByAdmin = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getAllOrdersByAdmin");
    const { page, limit, orderStatus, search } = req.query;
    const inquiry: AdminOrderInquiry = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      orderStatus: orderStatus as OrderStatus | undefined,
      search: search ? String(search) : undefined,
    };
    const result = await orderService.getAllOrdersByAdmin(inquiry);
    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, getAllOrdersByAdmin:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.updateOrderByAdmin = async (req: AdminRequest, res: Response) => {
  try {
    console.log("updateOrderByAdmin");
    const input: AdminOrderUpdateInput = req.body;
    const result = await orderService.updateOrderByAdmin(input)
    
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, updateOrderByAdmin:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
}

export default orderController;
