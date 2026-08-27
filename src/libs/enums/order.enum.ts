export enum OrderStatus {
  CREATED = "CREATED",
  PROCESSING = "PROCESSING",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED"
}

export enum OrderDeliveryLocation {
  SEOUL_GANGNAM = "Seoul (Gangnam HQ)",
  INCHEON = "Incheon (Songdo)",
  PYEONGTAEK = "Pyeongtaek",
  WONJU = "Wonju",
  SUWON = "Suwon",
  ASAN = "Asan",
  CHEONAN = "Cheonan",
  CHEONGJU = "Cheongju",
  DAEJEON = "Daejeon"
}

export enum LeaseTerm {
  ONE_MONTH = 1,
  THREE_MONTHS = 3,
  SIX_MONTHS = 6,
  TWELVE_MONTHS = 12,
  TWENTY_FOUR_MONTHS = 24,
  THIRTY_SIX_MONTHS = 36,
}

export enum OrderTab {
  ACTIVE = "ACTIVE",
  HISTORY = "HISTORY",
}
