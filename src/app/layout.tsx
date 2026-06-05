import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/store/AppStore";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "복지AI",
  description: "내 상황에 맞는 복지 혜택을 쉬운 말로 찾고 마감 전에 챙기세요.",
};

export const viewport: Viewport = {
  themeColor: "#18a058",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>
          <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-appbg shadow-[0_0_60px_rgba(0,0,0,0.06)]">
            {children}
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
