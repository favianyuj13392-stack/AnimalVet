"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function PersonalRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/personal/usuarios"); }, [router]);
  return null;
}
