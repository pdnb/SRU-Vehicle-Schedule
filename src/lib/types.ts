export interface Vehicle {
  id: number;
  code: string;
  name: string | null;
  licence: string | null;
  capacity: number | null;
  brand: string | null;
  carType: string | null;
  campus: string | null;
}

/** One car on one booking (a row of BUL_CARBOOKINGITEM). */
export interface Booking {
  itemId: number;
  bookingId: number;
  code: string;
  vehicleId: number;
  /** Local (Asia/Bangkok) date-time without offset, e.g. 2026-11-02T08:30:00 */
  start: string;
  end: string;
  title: string | null;
  location: string | null;
  places: string | null;
  remark: string | null;
  requester: string | null;
  department: string | null;
  driver: string | null;
  driverPhone: string | null;
  /** ผู้รับผิดชอบ (BUL_CARBOOKING.UNDERTAKERREFERID) */
  undertaker: string | null;
  undertakerPhone: string | null;
  /** Free-text contact details of the requester */
  contact: string | null;
  persons: number | null;
  status: string;
}

export interface StatusInfo {
  code: string;
  label: string;
}

export interface ScheduleData {
  date: string;
  source: "mock" | "promis";
  vehicles: Vehicle[];
  bookings: Booking[];
  statuses: StatusInfo[];
}

export interface ScheduleResponse extends ScheduleData {
  /** true when the viewer may not see phone numbers, so they were removed server-side */
  phonesHidden: boolean;
}

/** The signed-in user as passed to the client. */
export interface Viewer {
  name: string | null;
  email: string | null;
  canViewPhones: boolean;
}
