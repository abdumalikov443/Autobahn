export enum VehicleStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSE',
    DELETED = 'DELETED',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum VehicleType {
    SEDAN = 'SEDAN',
    COUPE = 'COUPE',
    SUV = 'SUV',
    ELECTRIC = 'ELECTRIC',
    HATCHBACK = 'HATCHBACK',
    OFF_ROAD = 'OFF_ROAD'
}

export enum VehicleFuelType {
    PETROL = 'PETROL',
    DIESEL = 'DIESEL',
    ELECTRICITY = 'ELECTRICITY'
}

export enum VehicleDriveTrain {
    AWD = 'AWD',
    FWD = 'FWD',
    RWD = 'RWD'
}

export enum VehicleSortBy {
  POPULAR = "popular",
  MOST_RENTED = "mostRented",
  PRICE_LOW = "priceLow",
  PRICE_HIGH = "priceHigh",
  POWERFUL = "powerful",
  NEWEST = "newest",
}