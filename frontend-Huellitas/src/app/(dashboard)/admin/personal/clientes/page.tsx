"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ClientesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/personal/usuarios?tab=clientes"); }, [router]);
  return null;
}
