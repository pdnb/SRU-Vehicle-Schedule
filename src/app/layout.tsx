import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "./providers";
import "./globals.css";

const thaiFont = Anuphan({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ตารางการใช้รถ | มหาวิทยาลัยราชภัฏสุราษฎร์ธานี",
  description: "ตารางการใช้รถยนต์ส่วนกลางรายวัน แยกตามคัน จากระบบ PROMIS",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={thaiFont.variable}>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
