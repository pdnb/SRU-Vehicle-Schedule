"use client";

import { LoginOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import type { Viewer } from "@/lib/types";

interface Props {
  viewer: Viewer | null;
  loginHref: string;
}

// The SDK's /auth/* routes must be plain navigations (not next/link), hence href on Button
export default function AccountBar({ viewer, loginHref }: Props) {
  if (!viewer) {
    return (
      <Button type="primary" icon={<LoginOutlined />} href={loginHref}>
        เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย
      </Button>
    );
  }
  return (
    <Space size={8} wrap>
      <Typography.Text type="secondary">
        <UserOutlined /> {viewer.name || viewer.email}
      </Typography.Text>
      <Button icon={<LogoutOutlined />} href="/auth/logout">
        ออกจากระบบ
      </Button>
    </Space>
  );
}
