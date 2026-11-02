"use client";

import { Card, Flex, Tag, Typography } from "antd";
import { formatRange } from "@/lib/dayjs";
import type { Booking, Vehicle } from "@/lib/types";
import { StatusTag } from "./BookingDrawer";

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  labels: Record<string, string>;
  onSelect: (booking: Booking) => void;
}

/** Narrow-screen view: one card per car, its trips listed in time order. */
export default function ScheduleList({ vehicles, bookings, labels, onSelect }: Props) {
  return (
    <Flex vertical gap={10}>
      {vehicles.map((v, i) => {
        const own = bookings
          .filter((b) => b.vehicleId === v.id)
          .sort((a, b) => a.start.localeCompare(b.start));
        return (
          <Card
            key={v.id}
            className="ml-card"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            size="small"
            title={
              <Flex vertical style={{ padding: "6px 0" }}>
                <span>{v.licence || v.code}</span>
                <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>
                  {v.name}
                  {v.capacity ? ` · ${v.capacity} ที่นั่ง` : ""}
                </Typography.Text>
              </Flex>
            }
            extra={own.length === 0 ? <Tag color="green">ว่างทั้งวัน</Tag> : <Tag>{own.length} รายการ</Tag>}
            styles={{ body: own.length === 0 ? { display: "none" } : { padding: 0 } }}
          >
            {own.map((b) => (
              <button
                key={b.itemId}
                type="button"
                onClick={() => onSelect(b)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  border: 0,
                  borderTop: "1px solid #f0f0f0",
                  background: "none",
                  font: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <Flex justify="space-between" align="center" gap={8}>
                  <span className="ml-time">{formatRange(b.start, b.end)}</span>
                  <StatusTag code={b.status} labels={labels} />
                </Flex>
                <div style={{ marginTop: 2 }}>{b.places || b.location || b.title || b.code}</div>
                {b.requester && (
                  <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                    {b.requester}
                    {b.department ? ` · ${b.department}` : ""}
                  </Typography.Text>
                )}
              </button>
            ))}
          </Card>
        );
      })}
    </Flex>
  );
}
