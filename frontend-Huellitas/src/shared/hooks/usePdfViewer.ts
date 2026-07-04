"use client";

import { useState } from "react";
import api from "@/shared/lib/axios";

interface PdfState {
  url: string;
  nombre: string;
}

export function usePdfViewer() {
  const [pdf, setPdf] = useState<PdfState | null>(null);
  const [loading, setLoading] = useState(false);

  const openPdf = async (endpoint: string, nombre: string) => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdf({ url, nombre });
    } catch (err) {
      console.error("Error al cargar el PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  const closePdf = () => {
    if (pdf?.url) URL.revokeObjectURL(pdf.url); // libera memoria
    setPdf(null);
  };

  return { pdf, loading, openPdf, closePdf };
}
