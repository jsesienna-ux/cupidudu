import type { Metadata } from "next";
import "./globals.css";
import { NavWrapper } from "@/components/NavWrapper";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cupidudu | 오늘의 인연",
  description: "Cupidudu - 당신의 특별한 인연을 만나보세요",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body className="min-h-screen bg-cupid-cream antialiased">
        <NavWrapper isAuthenticated={!!user}>{children}</NavWrapper>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
