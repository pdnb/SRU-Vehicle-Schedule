"use client";

import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";
import "@/lib/dayjs";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          colorPrimary: "#0b4f9c",
          fontFamily: "var(--font-thai), system-ui, sans-serif",
          fontSize: 16,
          borderRadius: 8,
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
