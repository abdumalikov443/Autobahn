import { shapeIntoMongooseObjectId } from "../libs/config";
import { ReviewStatus } from "../libs/enums/review.enum";
import { VehicleStatus } from "../libs/enums/vehicle.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import {
  Vehicle,
  VehicleInput,
  VehicleUpdateInput,
} from "../libs/types/vehicle";
import VehicleModel from "../schema/Vehicle.model";

class VehicleService {
  private readonly vehicleModel;

  constructor() {
    this.vehicleModel = VehicleModel;
  }

  /* SPA */

  public async getTopVehicles(): Promise<Vehicle[]> {
    const match: T = {
      vehicleStatus: VehicleStatus.ACTIVE,
      vehicleRentedCount: { $gte: 1 },
      vehicleViews: { $gte: 1 },
    };

    const result = await this.vehicleModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "reviews",
          let: { vehicleId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$vehicleId", "$$vehicleId"] },
                reviewStatus: ReviewStatus.APPROVED,
              },
            },
          ],
          as: "reviewData",
        },
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: "$reviewData.rating" }, 0] },
          reviewCount: { $size: "$reviewData" },
        },
      },
      { $sort: { averageRating: -1 } },
      { $limit: 5 },
      { $project: { reviewData: 0 } },
    ]);
    console.log("5 ta top car lar: ===== ", result);

    return result as unknown as Vehicle[];
  }

  /* BSSR */
  public async getAllVehicles(): Promise<Vehicle[]> {
    const result = await this.vehicleModel.find().exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Vehicle[];
  }

  public async createNewVehicle(input: VehicleInput): Promise<Vehicle> {
    try {
      return (await this.vehicleModel.create(input)) as unknown as Vehicle;
    } catch (err) {
      console.log("Error, createNewVehicle: ", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  public async updateChosenVehicle(
    id: string | string[],
    input: VehicleUpdateInput,
  ): Promise<Vehicle> {
    // string --> ObjectId
    id = shapeIntoMongooseObjectId(id);
    const result = await this.vehicleModel
      .findOneAndUpdate({ _id: id }, input, { new: true })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);

    return result as unknown as Vehicle;
  }
}

export default VehicleService;
