"use client";

import React, { useState } from "react";
import { ConfirmDialog, ConfirmDialogProps } from "@/shared/components/ui/confirm-dialog";

type Config = Omit<ConfirmDialogProps, "open" | "onOpenChange" | "loading">;

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Config>({
    title: "",
    onConfirm: () => {},
  });

  const openConfirm = (cfg: Config) => {
    setConfig(cfg);
    setOpen(true);
  };

  const dialog = (
    <ConfirmDialog
      open={open}
      onOpenChange={(v) => { if (!loading) setOpen(v); }}
      {...config}
      loading={loading}
      onConfirm={async () => {
        setLoading(true);
        try {
          await config.onConfirm();
        } finally {
          setLoading(false);
          setOpen(false);
        }
      }}
    />
  );

  return { openConfirm, dialog };
}
