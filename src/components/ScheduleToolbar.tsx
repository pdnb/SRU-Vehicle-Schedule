"use client";

import { LeftOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import { Button, DatePicker, Flex, Select, Space, Tooltip } from "antd";
import dayjs, { formatShortDate, type Dayjs } from "@/lib/dayjs";
import type { StatusInfo } from "@/lib/types";

export interface Filters {
  statuses: string[];
  campus?: string;
  carType?: string;
}

interface Props {
  date: Dayjs;
  onDateChange: (d: Dayjs) => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  statuses: StatusInfo[];
  campuses: string[];
  carTypes: string[];
  loading: boolean;
  updatedAt: Dayjs | null;
  onRefresh: () => void;
}

export default function ScheduleToolbar({
  date,
  onDateChange,
  filters,
  onFiltersChange,
  statuses,
  campuses,
  carTypes,
  loading,
  updatedAt,
  onRefresh,
}: Props) {
  const isToday = date.isSame(dayjs(), "day");

  return (
    <Flex wrap gap={8} align="center" justify="space-between" style={{ marginBottom: 12 }}>
      <Flex wrap gap={8} align="center">
        <Space.Compact>
          <Button icon={<LeftOutlined />} aria-label="วันก่อนหน้า" onClick={() => onDateChange(date.subtract(1, "day"))} />
          <Button type={isToday ? "primary" : "default"} onClick={() => onDateChange(dayjs())}>
            วันนี้
          </Button>
          <Button icon={<RightOutlined />} aria-label="วันถัดไป" onClick={() => onDateChange(date.add(1, "day"))} />
        </Space.Compact>
        <DatePicker
          value={date}
          onChange={(d) => d && onDateChange(d)}
          format={(v) => formatShortDate(v)}
          allowClear={false}
          inputReadOnly
          style={{ width: 150 }}
        />
        <Select
          mode="multiple"
          placeholder="สถานะ"
          value={filters.statuses}
          onChange={(statuses) => onFiltersChange({ ...filters, statuses })}
          options={statuses.map((s) => ({ value: s.code, label: s.label }))}
          maxTagCount="responsive"
          style={{ minWidth: 200, maxWidth: 320 }}
        />
        {campuses.length > 1 && (
          <Select
            allowClear
            placeholder="ทุกวิทยาเขต"
            value={filters.campus}
            onChange={(campus) => onFiltersChange({ ...filters, campus })}
            options={campuses.map((c) => ({ value: c, label: c }))}
            style={{ minWidth: 160 }}
          />
        )}
        {carTypes.length > 1 && (
          <Select
            allowClear
            placeholder="ทุกประเภทรถ"
            value={filters.carType}
            onChange={(carType) => onFiltersChange({ ...filters, carType })}
            options={carTypes.map((c) => ({ value: c, label: c }))}
            style={{ minWidth: 140 }}
          />
        )}
      </Flex>
      <Tooltip title={updatedAt ? `อัปเดตล่าสุด ${updatedAt.format("HH:mm:ss")} น.` : undefined}>
        <Button icon={<ReloadOutlined spin={loading} />} onClick={onRefresh} disabled={loading}>
          รีเฟรช
        </Button>
      </Tooltip>
    </Flex>
  );
}
