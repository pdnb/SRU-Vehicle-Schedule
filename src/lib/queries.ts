import "server-only";
import { promisSchema, query } from "./db";
import { mockSchedule } from "./mock";
import type { Booking, ScheduleData, StatusInfo, Vehicle } from "./types";

// All PROMIS SQL lives here. Tables/views come from PROMIS.sql:
//   CAR, CAMPUS, DEPARTMENT, REFER, SYSBYTEDES, BUL_CARBOOKING, BUL_CARBOOKINGPLACE,
//   BUL_CARDRIVER, V_BUL_CARBOOKINGITEM

interface VehicleRow {
  CARID: number;
  CARCODE: string;
  CARNAME: string | null;
  LICENCE: string | null;
  CAPACITY: number | null;
  BRAND: string | null;
  CARTYPENAME: string | null;
  CAMPUSNAME: string | null;
}

interface BookingRow {
  CARBOOKINGITEMID: number;
  CARBOOKINGID: number;
  CARBOOKINGCODE: string;
  CARID: number;
  START_AT: string;
  END_AT: string;
  CARBOOKINGNAME: string | null;
  LOCATION: string | null;
  PLACES: string | null;
  REMARK: string | null;
  REQUESTREFERNAME: string | null;
  DEPARTMENTNAME: string | null;
  DRIVERREFERNAME: string | null;
  DRIVERPHONE: string | null;
  UNDERTAKERNAME: string | null;
  UNDERTAKERPHONENO: string | null;
  CONTACT: string | null;
  PERSONAMOUNT: number | null;
  CARBOOKINGSTATUS: string;
}

interface StatusRow {
  BYTECODE: string;
  BYTEDES: string | null;
}

const MAX_TRIP_DAYS = 31;

const vehiclesSql = (s: string) => `
  SELECT C.CARID, C.CARCODE, C.CARNAME, C.LICENCE, C.CAPACITY, C.BRAND,
         NVL(T.BYTEDES, TO_CHAR(C.CARTYPE)) AS CARTYPENAME,
         CP.CAMPUSNAME
  FROM   ${s}.CAR C
  LEFT JOIN ${s}.CAMPUS CP ON CP.CAMPUSID = C.CAMPUSID
  LEFT JOIN ${s}.SYSBYTEDES T
         ON T.TABLENAME = 'CAR' AND T.COLUMNNAME = 'CARTYPE' AND T.BYTECODE = TO_CHAR(C.CARTYPE)
  WHERE  C.CANBOOKING = 'Y'
  ORDER  BY C.CARCODE`;

// DATETIMEFROM/DATETIMETO are computed by the view, so the raw DATEFROM/DATETO
// predicates are there to let Oracle narrow rows before evaluating them.
const bookingsSql = (s: string) => `
  SELECT V.CARBOOKINGITEMID, V.CARBOOKINGID, V.CARBOOKINGCODE, V.CARID,
         TO_CHAR(V.DATETIMEFROM, 'YYYY-MM-DD"T"HH24:MI:SS') AS START_AT,
         TO_CHAR(V.DATETIMETO, 'YYYY-MM-DD"T"HH24:MI:SS') AS END_AT,
         V.CARBOOKINGNAME, V.LOCATION, V.REMARK, V.REQUESTREFERNAME,
         V.DRIVERREFERNAME, V.PERSONAMOUNT, V.CARBOOKINGSTATUS,
         D.DEPARTMENTNAME,
         B.UNDERTAKERPHONENO, B.CONTACT, U.REFERNAME AS UNDERTAKERNAME,
         (SELECT MAX(DR.PHONENO)
          FROM   ${s}.BUL_CARDRIVER DR
          WHERE  DR.REFERID = V.DRIVERREFERID) AS DRIVERPHONE,
         (SELECT LISTAGG(P.PLACE, ', ') WITHIN GROUP (ORDER BY P.SEQUENCE)
          FROM   ${s}.BUL_CARBOOKINGPLACE P
          WHERE  P.CARBOOKINGID = V.CARBOOKINGID) AS PLACES
  FROM   ${s}.V_BUL_CARBOOKINGITEM V
  JOIN   ${s}.BUL_CARBOOKING B ON B.CARBOOKINGID = V.CARBOOKINGID
  LEFT JOIN ${s}.DEPARTMENT D ON D.DEPARTMENTID = V.DEPARTMENTID
  LEFT JOIN ${s}.REFER U ON U.REFERID = B.UNDERTAKERREFERID
  WHERE  V.DATEFROM < TO_DATE(:d, 'YYYY-MM-DD') + 1
    AND  V.DATETO >= TO_DATE(:d, 'YYYY-MM-DD')
    AND  V.DATETIMEFROM < TO_DATE(:d, 'YYYY-MM-DD') + 1
    AND  V.DATETIMETO > TO_DATE(:d, 'YYYY-MM-DD')
    -- Skip mistyped records (e.g. a Buddhist-era year as the return date) that would cover every day
    AND  V.DATETIMETO - V.DATETIMEFROM <= ${MAX_TRIP_DAYS}
  ORDER  BY V.CARID, V.DATETIMEFROM`;

/** BUL_CARBOOKINGPLACE sometimes holds document links instead of place names. */
function cleanPlaces(places: string | null): string | null {
  if (!places) return null;
  const names = places
    .split(", ")
    .map((p) => p.trim())
    .filter((p) => p && !/^https?:\/\//i.test(p));
  return names.length ? names.join(", ") : null;
}

// Same lookup V_BUL_CARBOOKING uses for CARBOOKINGSTATUSNAME
const statusesSql = (s: string) => `
  SELECT BYTECODE, BYTEDES
  FROM   ${s}.SYSBYTEDES
  WHERE  TABLENAME = 'ROOMBOOKING' AND COLUMNNAME = 'ROOMBOOKINGSTATUS'
  ORDER  BY BYTEORDER, BYTECODE`;

const STATUS_TTL_MS = 60 * 60 * 1000;
let statusCache: { at: number; data: StatusInfo[] } | undefined;

async function getStatuses(schema: string): Promise<StatusInfo[]> {
  if (statusCache && Date.now() - statusCache.at < STATUS_TTL_MS) return statusCache.data;
  const rows = await query<StatusRow>(statusesSql(schema));
  const data = rows.map((r) => ({ code: r.BYTECODE, label: r.BYTEDES ?? r.BYTECODE }));
  statusCache = { at: Date.now(), data };
  return data;
}

export function isMockMode(): boolean {
  return process.env.USE_MOCK === "1" || !process.env.ORACLE_CONNECT_STRING;
}

export async function getSchedule(date: string): Promise<ScheduleData> {
  if (isMockMode()) return mockSchedule(date);

  const schema = promisSchema();
  const [vehicleRows, bookingRows, statuses] = await Promise.all([
    query<VehicleRow>(vehiclesSql(schema)),
    query<BookingRow>(bookingsSql(schema), { d: date }),
    getStatuses(schema),
  ]);

  const vehicles: Vehicle[] = vehicleRows.map((r) => ({
    id: r.CARID,
    code: r.CARCODE,
    name: r.CARNAME,
    licence: r.LICENCE,
    capacity: r.CAPACITY,
    brand: r.BRAND,
    carType: r.CARTYPENAME,
    campus: r.CAMPUSNAME,
  }));

  const bookings: Booking[] = bookingRows.map((r) => ({
    itemId: r.CARBOOKINGITEMID,
    bookingId: r.CARBOOKINGID,
    code: r.CARBOOKINGCODE,
    vehicleId: r.CARID,
    start: r.START_AT,
    end: r.END_AT,
    title: r.CARBOOKINGNAME,
    location: r.LOCATION,
    places: cleanPlaces(r.PLACES),
    remark: r.REMARK,
    requester: r.REQUESTREFERNAME,
    department: r.DEPARTMENTNAME,
    driver: r.DRIVERREFERNAME,
    driverPhone: r.DRIVERPHONE,
    undertaker: r.UNDERTAKERNAME,
    undertakerPhone: r.UNDERTAKERPHONENO,
    contact: r.CONTACT,
    persons: r.PERSONAMOUNT,
    status: r.CARBOOKINGSTATUS,
  }));

  return { date, source: "promis", vehicles, bookings, statuses };
}
