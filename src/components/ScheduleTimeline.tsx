"use client";

import { Tooltip } from "antd";
import { useMemo } from "react";
import dayjs, { formatRange, type Dayjs } from "@/lib/dayjs";
import { statusLabel, statusStyle } from "@/lib/status";
import type { Booking, Vehicle } from "@/lib/types";
import { PlaceList } from "./BookingDrawer";

// Minimum hour width; the grid stretches to fill wider screens
const HOUR_MIN_W = 84;
const LABEL_W = 240;
const LANE_H = 50;
const LANE_GAP = 4;
const ROW_PAD = 8;
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;
// Entrance choreography: rows cascade down, then each bar draws in from its start time
const ROW_STAGGER_MS = 35;
const ROW_STAGGER_CAP = 15;
const BAR_SWEEP_MS = 300;

interface Props {
  date: string;
  vehicles: Vehicle[];
  bookings: Booking[];
  labels: Record<string, string>;
  now: Dayjs;
  onSelect: (booking: Booking) => void;
}

interface PlacedBooking {
  booking: Booking;
  startMin: number;
  endMin: number;
  lane: number;
  contLeft: boolean;
  contRight: boolean;
}

/** Clip each booking to the viewed day and stack overlapping ones into lanes. */
function placeBookings(list: Booking[], dayStart: Dayjs): { placed: PlacedBooking[]; lanes: number } {
  const dayEnd = dayStart.add(1, "day");
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  const laneEnds: number[] = [];
  const placed = sorted.map((booking) => {
    const s = dayjs(booking.start);
    const e = dayjs(booking.end);
    const startMin = Math.max(0, s.diff(dayStart, "minute"));
    const endMin = Math.min(24 * 60, Math.max(startMin + 15, e.diff(dayStart, "minute")));
    let lane = laneEnds.findIndex((end) => end <= startMin);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endMin;
    return { booking, startMin, endMin, lane, contLeft: s.isBefore(dayStart), contRight: e.isAfter(dayEnd) };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

export default function ScheduleTimeline({ date, vehicles, bookings, labels, now, onSelect }: Props) {
  const dayStart = useMemo(() => dayjs(date).startOf("day"), [date]);

  const rows = useMemo(() => {
    const byVehicle = new Map<number, Booking[]>();
    for (const b of bookings) {
      const list = byVehicle.get(b.vehicleId);
      if (list) list.push(b);
      else byVehicle.set(b.vehicleId, [b]);
    }
    return vehicles.map((vehicle) => ({ vehicle, ...placeBookings(byVehicle.get(vehicle.id) ?? [], dayStart) }));
  }, [vehicles, bookings, dayStart]);

  // Widen the visible hours when a booking starts earlier or ends later than usual on this day.
  // Trips carried over from/into another day are pinned to the grid edge instead.
  const [startHour, endHour] = useMemo(() => {
    let min = DEFAULT_START_HOUR * 60;
    let max = DEFAULT_END_HOUR * 60;
    for (const r of rows) {
      for (const p of r.placed) {
        if (!p.contLeft) min = Math.min(min, p.startMin);
        if (!p.contRight) max = Math.max(max, p.endMin);
      }
    }
    return [Math.floor(min / 60), Math.ceil(max / 60)];
  }, [rows]);

  const minTrackW = (endHour - startHour) * HOUR_MIN_W;
  const clampMin = (min: number) => Math.min(Math.max(min, startHour * 60), endHour * 60);
  // Horizontal position as a percentage of the track width
  const toPct = (min: number) => ((clampMin(min) - startHour * 60) / ((endHour - startHour) * 60)) * 100;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const nowMin = now.diff(dayStart, "minute");
  const showNow = now.isSame(dayStart, "day") && nowMin >= startHour * 60 && nowMin <= endHour * 60;

  return (
    <div className="tl-scroll" role="region" aria-label="ตารางการใช้รถรายวัน">
      <div className="tl-inner" style={{ minWidth: LABEL_W + minTrackW }}>
        <div className="tl-header">
          <div className="tl-label" style={{ width: LABEL_W }}>
            รถ ({vehicles.length} คัน)
          </div>
          <div className="tl-hours">
            {hours.map((h) => (
              <div key={h} className="tl-hour" style={{ left: `${toPct(h * 60)}%`, width: `${100 / hours.length}%` }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
            {showNow && (
              <div className="tl-now-flag" style={{ left: `${toPct(nowMin)}%` }}>
                {now.format("HH:mm")}
              </div>
            )}
          </div>
        </div>

        {rows.map(({ vehicle, placed, lanes }, rowIndex) => {
          const height = ROW_PAD * 2 + lanes * LANE_H + (lanes - 1) * LANE_GAP;
          const rowDelay = Math.min(rowIndex, ROW_STAGGER_CAP) * ROW_STAGGER_MS;
          return (
            <div className="tl-row" key={vehicle.id} style={{ animationDelay: `${rowDelay}ms` }}>
              <div className="tl-label" style={{ width: LABEL_W, minHeight: height }}>
                <span className="tl-plate">{vehicle.licence || vehicle.code}</span>
                <span className="tl-carname">
                  {vehicle.name}
                  {vehicle.capacity ? ` · ${vehicle.capacity} ที่นั่ง` : ""}
                </span>
              </div>
              <div
                className="tl-track"
                style={{ height }}
              >
                {hours.map((h) => (
                  <div key={h} className="tl-gridline" style={{ left: `${toPct(h * 60)}%` }} />
                ))}
                {showNow && <div className="tl-now" style={{ left: `${toPct(nowMin)}%` }} />}
                {placed.map(({ booking, startMin, endMin, lane, contLeft, contRight }) => {
                  const style = statusStyle(booking.status);
                  const destination = booking.places || booking.location;
                  const classes = ["tl-bar"];
                  if (contLeft) classes.push("tl-bar--cont-left");
                  if (contRight) classes.push("tl-bar--cont-right");
                  return (
                    <Tooltip
                      key={booking.itemId}
                      title={
                        <div>
                          <div>
                            <b>{booking.title || booking.code}</b>
                          </div>
                          <div>{formatRange(booking.start, booking.end)}</div>
                          {destination && (
                            <div>
                              ปลายทาง: <PlaceList value={destination} />
                            </div>
                          )}
                          {booking.requester && <div>ผู้ขอ: {booking.requester}</div>}
                          {booking.driver && (
                            <div>
                              คนขับ: {booking.driver}
                              {booking.driverPhone ? ` (${booking.driverPhone})` : ""}
                            </div>
                          )}
                          <div>สถานะ: {statusLabel(labels, booking.status)}</div>
                        </div>
                      }
                    >
                      <button
                        type="button"
                        className={classes.join(" ")}
                        onClick={() => onSelect(booking)}
                        style={{
                          left: `calc(${toPct(startMin)}% + 2px)`,
                          width: `max(calc(${toPct(endMin) - toPct(startMin)}% - 4px), 10px)`,
                          top: ROW_PAD + lane * (LANE_H + LANE_GAP),
                          height: LANE_H,
                          color: style.color,
                          background: style.background,
                          borderColor: style.color,
                          borderStyle: style.dashed ? "dashed" : "solid",
                          animationDelay: `${rowDelay + 120 + (toPct(startMin) / 100) * BAR_SWEEP_MS}ms`,
                        }}
                      >
                        <span className="tl-bar-time">
                          {contLeft ? `‹ ${dayjs(booking.start).format("D MMM")}` : dayjs(booking.start).format("HH:mm")}
                          {" – "}
                          {contRight ? `${dayjs(booking.end).format("D MMM")} ›` : dayjs(booking.end).format("HH:mm")}
                        </span>
                        <span className="tl-bar-text">{destination || booking.title || booking.code}</span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
