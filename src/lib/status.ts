// CARBOOKINGSTATUS codes in PROMIS (SYSBYTEDES ROOMBOOKING/ROOMBOOKINGSTATUS):
//   W = ทำการ (draft, default for new requests), A = บันทึก, S = อนุมัติ/ส่งรายการ, V = ยกเลิก
// A and S are what PROMIS treats as "car not available" (see V_BUL_CARNOTVACANCY).
export const OCCUPYING_STATUSES = ["A", "S"];
export const DEFAULT_VISIBLE_STATUSES = ["S"];

export interface StatusStyle {
  color: string;
  background: string;
  dashed: boolean;
}

const STYLES: Record<string, StatusStyle> = {
  A: { color: "#0958d9", background: "#e6f4ff", dashed: false },
  S: { color: "#389e0d", background: "#f6ffed", dashed: false },
  W: { color: "#d46b08", background: "#fff7e6", dashed: true },
};

const OTHER: StatusStyle = { color: "#8c8c8c", background: "#f5f5f5", dashed: true };

export function statusStyle(code: string): StatusStyle {
  return STYLES[code] ?? OTHER;
}

/** Thai label from SYSBYTEDES, falling back to the raw code. */
export function statusLabel(labels: Record<string, string>, code: string): string {
  return labels[code] ?? code;
}
