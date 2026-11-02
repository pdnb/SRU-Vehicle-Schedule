import type { Booking, ScheduleData, StatusInfo, Vehicle } from "./types";

const vehicles: Vehicle[] = [
  { id: 1, code: "V001", name: "รถตู้ Toyota Commuter", licence: "นข 1234 สฎ", capacity: 12, brand: "Toyota", carType: "รถตู้", campus: "ส่วนกลาง" },
  { id: 2, code: "V002", name: "รถตู้ Toyota Commuter", licence: "นข 2345 สฎ", capacity: 12, brand: "Toyota", carType: "รถตู้", campus: "ส่วนกลาง" },
  { id: 3, code: "V003", name: "รถตู้ Hyundai H-1", licence: "นข 3456 สฎ", capacity: 11, brand: "Hyundai", carType: "รถตู้", campus: "ส่วนกลาง" },
  { id: 4, code: "S001", name: "รถเก๋ง Toyota Camry", licence: "กข 4567 สฎ", capacity: 4, brand: "Toyota", carType: "รถเก๋ง", campus: "ส่วนกลาง" },
  { id: 5, code: "P001", name: "รถกระบะ Isuzu D-Max", licence: "บข 5678 สฎ", capacity: 4, brand: "Isuzu", carType: "รถกระบะ", campus: "ส่วนกลาง" },
  { id: 6, code: "B001", name: "รถบัส 40 ที่นั่ง", licence: "40-1234 สฎ", capacity: 40, brand: "Hino", carType: "รถบัส", campus: "ส่วนกลาง" },
  { id: 7, code: "V004", name: "รถตู้ Toyota Commuter", licence: "นข 6789 สฎ", capacity: 12, brand: "Toyota", carType: "รถตู้", campus: "วิทยาเขตเกาะสมุย" },
  { id: 8, code: "P002", name: "รถกระบะ Toyota Revo", licence: "บข 7890 สฎ", capacity: 4, brand: "Toyota", carType: "รถกระบะ", campus: "วิทยาเขตเกาะสมุย" },
];

// Same codes and labels as SYSBYTEDES in PROMIS
const statuses: StatusInfo[] = [
  { code: "W", label: "ทำการ" },
  { code: "A", label: "บันทึก" },
  { code: "S", label: "อนุมัติ/ส่งรายการ" },
  { code: "V", label: "ยกเลิก" },
];

type Template = Omit<
  Booking,
  "itemId" | "bookingId" | "code" | "start" | "end" | "driverPhone" | "undertaker" | "undertakerPhone" | "contact"
> & {
  from: string;
  to: string;
  /** days added to the end date, for multi-day trips */
  endOffset?: number;
};

const templates: Template[] = [
  { vehicleId: 1, from: "07:30", to: "12:00", title: "ไปราชการ สำนักงานเขตพื้นที่การศึกษา", location: "อาคารบริหาร", places: "สพป.สุราษฎร์ธานี เขต 1", remark: null, requester: "นางสาวสมใจ ใจดี", department: "สำนักงานอธิการบดี", driver: "นายสมชาย ขับดี", persons: 6, status: "A" },
  { vehicleId: 1, from: "13:00", to: "16:30", title: "รับ-ส่งวิทยากร", location: "คณะครุศาสตร์", places: "ท่าอากาศยานสุราษฎร์ธานี", remark: null, requester: "ผศ.ดร.วิชัย เก่งงาน", department: "คณะครุศาสตร์", driver: "นายสมชาย ขับดี", persons: 2, status: "W" },
  { vehicleId: 2, from: "06:00", to: "18:00", title: "นำนักศึกษาศึกษาดูงาน", location: "หน้าอาคาร 9", places: "อุทยานแห่งชาติเขาสก", remark: null, requester: "อ.ปรีชา สอนดี", department: "คณะวิทยาศาสตร์และเทคโนโลยี", driver: "นายประยุทธ ปลอดภัย", persons: 11, status: "A", endOffset: 1 },
  { vehicleId: 3, from: "09:00", to: "11:30", title: "ประชุมคณะกรรมการ", location: "อาคารบริหาร", places: "ศาลากลางจังหวัดสุราษฎร์ธานี", remark: null, requester: "นายธนา รักงาน", department: "กองนโยบายและแผน", driver: "นายวีระ ตรงเวลา", persons: 4, status: "S" },
  { vehicleId: 4, from: "08:00", to: "10:00", title: "รับผู้บริหาร", location: "บ้านพักผู้บริหาร", places: "มหาวิทยาลัย", remark: null, requester: "สำนักงานอธิการบดี", department: "สำนักงานอธิการบดี", driver: "นายอำนาจ สุภาพ", persons: 1, status: "A" },
  { vehicleId: 4, from: "14:00", to: "17:00", title: "ติดต่อราชการธนาคาร", location: "อาคารบริหาร", places: "ธนาคารกรุงไทย สาขาสุราษฎร์ธานี", remark: null, requester: "นางวันดี ละเอียด", department: "กองคลัง", driver: "นายอำนาจ สุภาพ", persons: 2, status: "W" },
  { vehicleId: 5, from: "10:00", to: "15:00", title: "ขนย้ายครุภัณฑ์", location: "กองอาคารสถานที่", places: "อาคารเรียนรวม", remark: null, requester: "นายช่างใหญ่ แข็งแรง", department: "กองอาคารสถานที่", driver: "นายมานพ ขยัน", persons: 3, status: "A" },
  { vehicleId: 6, from: "05:30", to: "20:30", title: "กิจกรรมค่ายอาสา", location: "หน้าหอประชุม", places: "อำเภอพุนพิน, อำเภอท่าชนะ", remark: null, requester: "อ.สุนทร มีน้ำใจ", department: "กองพัฒนานักศึกษา", driver: "นายบุญมี ชำนาญ", persons: 38, status: "A" },
  { vehicleId: 7, from: "09:30", to: "12:30", title: "ส่งเอกสารท่าเรือ", location: "วิทยาเขตเกาะสมุย", places: "ท่าเรือหน้าทอน", remark: null, requester: "นางสาวพรทิพย์ ใส่ใจ", department: "วิทยาเขตเกาะสมุย", driver: "นายสมศักดิ์ ทะเลงาม", persons: 2, status: "V" },
];

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Sample data built around the requested date so every day has something to show. */
export function mockSchedule(date: string): ScheduleData {
  // Rotate which templates appear so neighbouring days look different
  const seed = Number(date.replaceAll("-", "")) % templates.length;
  const bookings: Booking[] = templates
    .filter((_, i) => (i + seed) % 5 !== 0)
    .map((t, i) => {
      const { from, to, endOffset = 0, ...rest } = t;
      return {
        ...rest,
        itemId: 1000 + i,
        // Obviously fake numbers for the sample data
        driverPhone: `081-000-${String(1000 + rest.vehicleId).slice(-4)}`,
        undertaker: rest.requester,
        undertakerPhone: `089-000-${String(2000 + i).slice(-4)}`,
        contact: null,
        bookingId: 500 + i,
        code: `CB${date.slice(2, 4)}-${String(100 + i).padStart(4, "0")}`,
        start: `${date}T${from}:00`,
        end: `${shift(date, endOffset)}T${to}:00`,
      };
    });

  return { date, source: "mock", vehicles, bookings, statuses };
}
