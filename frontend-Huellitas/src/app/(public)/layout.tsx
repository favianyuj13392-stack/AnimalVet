import React from "react";
import PublicNavbar from "@/shared/components/layout/PublicNavbar";
import Footer from "@/shared/components/layout/Footer";
import { PawTrail } from "@/shared/components/PawTrail";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PawTrail />
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}