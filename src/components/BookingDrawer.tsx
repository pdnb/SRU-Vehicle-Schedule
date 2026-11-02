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
  /** Phone numbers were removed by the API; show a sign-in link in their place */
  phonesHidden: boolean;
  loginHref: string;
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

/** Booking places arrive joined with ", " (see cleanPlaces); several stops render as bullets. */
export function PlaceList({ value }: { value: string | null }) {
  if (!value) return <>–</>;
  const names = value.split(", ");
  if (names.length === 1) return <>{value}</>;
  return (
    <ul className="place-list">
      {names.map((name, i) => (
        <li key={i}>{name}</li>
      ))}
    </ul>
  );
}

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

function PersonWithPhone({ name, phone, loginHref }: { name: string | null; phone: string | null; loginHref?: string }) {
  if (!name && !phone) return <>–</>;
  return (
    <>
      {name && <div>{name}</div>}
      {phone && (
        <div>
          โทร <PhoneLinks value={phone} />
        </div>
      )}
      {loginHref && (
        <div className="phone-login">
          <a href={loginHref}>เข้าสู่ระบบด้วยบัญชี @sru.ac.th เพื่อดูเบอร์โทร</a>
        </div>
      )}
    </>
  );
}

export default function BookingDrawer({ booking, vehicle, labels, fullWidth, phonesHidden, loginHref, onClose }: Props) {
  const phoneLogin = phonesHidden ? loginHref : undefined;
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
            { key: "places", label: "ปลายทาง", children: <PlaceList value={booking.places} /> },
            { key: "location", label: "สถานที่รับ–ส่ง", children: dash(booking.location) },
            { key: "requester", label: "ผู้ขอ", children: dash(booking.requester) },
            { key: "department", label: "หน่วยงาน", children: dash(booking.department) },
            ...(booking.contact ? [{ key: "contact", label: "ติดต่อผู้ขอ", children: booking.contact }] : []),
            {
              key: "undertaker",
              label: "ผู้รับผิดชอบ",
              children: <PersonWithPhone name={booking.undertaker} phone={booking.undertakerPhone} loginHref={phoneLogin} />,
            },
            {
              key: "driver",
              label: "พนักงานขับรถ",
              children: <PersonWithPhone name={booking.driver} phone={booking.driverPhone} loginHref={phoneLogin} />,
            },
            { key: "persons", label: "จำนวนคน", children: booking.persons ? `${booking.persons} คน` : "–" },
            ...(booking.remark ? [{ key: "remark", label: "ความจำเป็น", children: booking.remark }] : []),
          ]}
        />
      )}
    </Drawer>
  );
}
