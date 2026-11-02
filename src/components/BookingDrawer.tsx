"use client";

import { Descriptions, Drawer, Tag } from "antd";
import { formatRange } from "@/lib/dayjs";
import { statusLabel, statusStyle } from "@/lib/status";
import type { Booking, Vehicle } from "@/lib/types";

interface Props {
  booking: Booking | null;
  vehicle: Vehicle | undefined;
  labels: Record<string, string>;
  fullWidth: boolean;
  onClose: () => void;
}

export function StatusTag({ code, labels }: { code: string; labels: Record<string, string> }) {
  const style = statusStyle(code);
  return (
    <Tag color={style.background} style={{ color: style.color, borderColor: style.color, marginInlineEnd: 0 }}>
      {statusLabel(labels, code)}
    </Tag>
  );
}

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "–" : v);

/** PROMIS phone fields are free text and may hold several numbers ("081-..., 077-..."). */
function PhoneLinks({ value }: { value: string | null }) {
  if (!value) return null;
  const parts = value.split(/[,;/]/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const digits = p.replace(/[^\d+]/g, "");
        return (
          <span key={i}>
            {i > 0 && ", "}
            {digits.length >= 9 ? <a href={`tel:${digits}`}>{p}</a> : p}
          </span>
        );
      })}
    </>
  );
}

function PersonWithPhone({ name, phone }: { name: string | null; phone: string | null }) {
  if (!name && !phone) return <>–</>;
  return (
    <>
      {name && <div>{name}</div>}
      {phone && (
        <div>
          โทร <PhoneLinks value={phone} />
        </div>
      )}
    </>
  );
}

export default function BookingDrawer({ booking, vehicle, labels, fullWidth, onClose }: Props) {
  return (
    <Drawer
      open={!!booking}
      onClose={onClose}
      width={fullWidth ? "100%" : 460}
      title={booking ? `ใบจองรถ ${booking.code}` : ""}
      extra={booking && <StatusTag code={booking.status} labels={labels} />}
      destroyOnHidden
    >
      {booking && (
        <Descriptions
          column={1}
          size="small"
          bordered
          styles={{ label: { width: 130, whiteSpace: "nowrap" } }}
          items={[
            { key: "car", label: "รถ", children: vehicle ? `${vehicle.licence || vehicle.code} · ${dash(vehicle.name)}` : booking.vehicleId },
            { key: "time", label: "เวลาไป–กลับ", children: formatRange(booking.start, booking.end) },
            { key: "title", label: "เรื่อง", children: dash(booking.title) },
            { key: "places", label: "ปลายทาง", children: dash(booking.places) },
            { key: "location", label: "สถานที่รับ–ส่ง", children: dash(booking.location) },
            { key: "requester", label: "ผู้ขอ", children: dash(booking.requester) },
            { key: "department", label: "หน่วยงาน", children: dash(booking.department) },
            ...(booking.contact ? [{ key: "contact", label: "ติดต่อผู้ขอ", children: booking.contact }] : []),
            {
              key: "undertaker",
              label: "ผู้รับผิดชอบ",
              children: <PersonWithPhone name={booking.undertaker} phone={booking.undertakerPhone} />,
            },
            {
              key: "driver",
              label: "พนักงานขับรถ",
              children: <PersonWithPhone name={booking.driver} phone={booking.driverPhone} />,
            },
            { key: "persons", label: "จำนวนคน", children: booking.persons ? `${booking.persons} คน` : "–" },
            ...(booking.remark ? [{ key: "remark", label: "ความจำเป็น", children: booking.remark }] : []),
          ]}
        />
      )}
    </Drawer>
  );
}
