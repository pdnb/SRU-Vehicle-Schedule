"use client";

import { Alert, Button, Card, Col, Empty, Grid, Row, Skeleton, Statistic, Tag } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { DATE_PARAM, formatThaiDate, type Dayjs } from "@/lib/dayjs";
import { DEFAULT_VISIBLE_STATUSES, OCCUPYING_STATUSES, statusLabel, statusStyle } from "@/lib/status";
import type { Booking, ScheduleResponse, StatusInfo } from "@/lib/types";
import BookingDrawer from "./BookingDrawer";
import ScheduleList from "./ScheduleList";
import ScheduleTimeline from "./ScheduleTimeline";
import ScheduleToolbar, { type Filters } from "./ScheduleToolbar";

const REFRESH_MS = 5 * 60 * 1000;

function parseDateParam(value: string | null): Dayjs {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return dayjs();
  const d = dayjs(value);
  return d.isValid() ? d : dayjs();
}

export default function ScheduleApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const date = parseDateParam(searchParams.get("date"));
  const dateKey = date.format(DATE_PARAM);

  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Dayjs | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [filters, setFilters] = useState<Filters>({ statuses: DEFAULT_VISIBLE_STATUSES });
  const [now, setNow] = useState(() => dayjs());
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/schedule?date=${dateKey}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error([body?.error ?? `HTTP ${res.status}`, body?.detail].filter(Boolean).join(" — "));
        return body as ScheduleResponse;
      })
      .then((body) => {
        setData(body);
        setError(null);
        setUpdatedAt(dayjs());
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [dateKey, reloadKey]);

  useEffect(() => {
    const refreshTimer = setInterval(refresh, REFRESH_MS);
    const clockTimer = setInterval(() => setNow(dayjs()), 60 * 1000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(clockTimer);
    };
  }, [refresh]);

  const changeDate = (d: Dayjs) => {
    const params = new URLSearchParams(searchParams.toString());
    if (d.isSame(dayjs(), "day")) params.delete("date");
    else params.set("date", d.format(DATE_PARAM));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Data for a stale date may still be on screen while the next one loads
  const current = data && data.date === dateKey ? data : null;

  const labels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of current?.statuses ?? []) map[s.code] = s.label;
    return map;
  }, [current]);

  // Status options: everything SYSBYTEDES knows plus any code that shows up in the data
  const statusOptions = useMemo<StatusInfo[]>(() => {
    const list = [...(current?.statuses ?? [])];
    for (const b of current?.bookings ?? []) {
      if (!list.some((s) => s.code === b.status)) list.push({ code: b.status, label: b.status });
    }
    return list;
  }, [current]);

  const campuses = useMemo(
    () => [...new Set((current?.vehicles ?? []).map((v) => v.campus).filter((c): c is string => !!c))],
    [current],
  );
  const carTypes = useMemo(
    () => [...new Set((current?.vehicles ?? []).map((v) => v.carType).filter((c): c is string => !!c))],
    [current],
  );

  const vehicles = useMemo(
    () =>
      (current?.vehicles ?? []).filter(
        (v) => (!filters.campus || v.campus === filters.campus) && (!filters.carType || v.carType === filters.carType),
      ),
    [current, filters.campus, filters.carType],
  );

  const bookings = useMemo(() => {
    const ids = new Set(vehicles.map((v) => v.id));
    return (current?.bookings ?? []).filter((b) => ids.has(b.vehicleId) && filters.statuses.includes(b.status));
  }, [current, vehicles, filters.statuses]);

  const stats = useMemo(() => {
    const inUse = new Set(
      bookings
        .filter((b) => OCCUPYING_STATUSES.includes(b.status) && !now.isBefore(b.start) && now.isBefore(b.end))
        .map((b) => b.vehicleId),
    );
    const booked = new Set(bookings.filter((b) => OCCUPYING_STATUSES.includes(b.status)).map((b) => b.vehicleId));
    return {
      total: vehicles.length,
      inUse: inUse.size,
      freeAllDay: vehicles.length - booked.size,
      bookings: bookings.length,
      pending: bookings.filter((b) => b.status === "W").length,
    };
  }, [vehicles, bookings, now]);

  const isToday = date.isSame(now, "day");
  const selectedVehicle = selected ? current?.vehicles.find((v) => v.id === selected.vehicleId) : undefined;

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">ตารางการใช้รถ</h1>
          <p className="page-date">
            {formatThaiDate(date)}
            {current?.source === "mock" && (
              <Tag color="gold" style={{ marginInlineStart: 8 }}>
                ข้อมูลตัวอย่าง
              </Tag>
            )}
          </p>
        </div>
      </header>

      <ScheduleToolbar
        date={date}
        onDateChange={changeDate}
        filters={filters}
        onFiltersChange={setFilters}
        statuses={statusOptions}
        campuses={campuses}
        carTypes={carTypes}
        loading={loading}
        updatedAt={updatedAt}
        onRefresh={refresh}
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="โหลดข้อมูลไม่สำเร็จ"
          description={error}
          action={
            <Button size="small" onClick={refresh}>
              ลองใหม่
            </Button>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {!current && loading && <Skeleton active paragraph={{ rows: 8 }} />}

      {current && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="รถทั้งหมด" value={stats.total} suffix="คัน" />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                {isToday ? (
                  <Statistic title="กำลังใช้งานตอนนี้" value={stats.inUse} suffix="คัน" valueStyle={{ color: statusStyle("A").color }} />
                ) : (
                  <Statistic title="รถที่มีการจอง" value={stats.total - stats.freeAllDay} suffix="คัน" valueStyle={{ color: statusStyle("A").color }} />
                )}
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="ว่างทั้งวัน" value={stats.freeAllDay} suffix="คัน" valueStyle={{ color: statusStyle("S").color }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="รายการจอง"
                  value={stats.bookings}
                  suffix={stats.pending ? <span style={{ fontSize: 13, color: statusStyle("W").color }}>{statusLabel(labels, "W")} {stats.pending}</span> : "รายการ"}
                />
              </Card>
            </Col>
          </Row>

          {vehicles.length === 0 ? (
            <Card>
              <Empty description="ไม่พบรถตามเงื่อนไขที่เลือก" />
            </Card>
          ) : isMobile ? (
            <ScheduleList vehicles={vehicles} bookings={bookings} labels={labels} onSelect={setSelected} />
          ) : (
            <ScheduleTimeline
              date={dateKey}
              vehicles={vehicles}
              bookings={bookings}
              labels={labels}
              now={now}
              onSelect={setSelected}
            />
          )}

          {!isMobile && vehicles.length > 0 && (
            <div className="legend" aria-label="คำอธิบายสี">
              {statusOptions
                .filter((s) => filters.statuses.includes(s.code))
                .map((s) => {
                  const st = statusStyle(s.code);
                  return (
                    <span key={s.code} className="legend-item">
                      <span
                        className="legend-swatch"
                        style={{ background: st.background, borderColor: st.color, borderStyle: st.dashed ? "dashed" : "solid" }}
                      />
                      {s.label}
                    </span>
                  );
                })}
              {isToday && (
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--now)", borderColor: "var(--now)", width: 3 }} />
                  เวลาปัจจุบัน
                </span>
              )}
            </div>
          )}
        </>
      )}

      <BookingDrawer
        booking={selected}
        vehicle={selectedVehicle}
        labels={labels}
        fullWidth={isMobile}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}
