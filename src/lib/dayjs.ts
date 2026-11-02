import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

export default dayjs;
export type { Dayjs };

export const DATE_PARAM = "YYYY-MM-DD";

export function formatThaiDate(d: Dayjs): string {
  return d.format("วันddddที่ D MMMM BBBB");
}

export function formatShortDate(d: Dayjs): string {
  return d.format("D MMM BB");
}

/** "08:30–12:00", or with dates when the trip spans more than one day. */
export function formatRange(start: string, end: string): string {
  const s = dayjs(start);
  const e = dayjs(end);
  if (s.isSame(e, "day")) return `${s.format("HH:mm")}–${e.format("HH:mm")} น.`;
  return `${formatShortDate(s)} ${s.format("HH:mm")} – ${formatShortDate(e)} ${e.format("HH:mm")} น.`;
}
