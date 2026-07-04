"use client";

import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "destructive" | "warning" | "default";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const variantConfig = {
  destructive: {
    icon: <AlertTriangle className="h-10 w-10 text-destructive" />,
    buttonClass: "bg-destructive hover:bg-destructive/90 text-white",
  },
  warning: {
    icon: <AlertCircle className="h-10 w-10 text-amber-500" />,
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  default: {
    icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
    buttonClass: "",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const { icon, buttonClass } = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl text-center" showCloseButton={false}>
        <DialogHeader className="items-center gap-3 pt-2">
          {icon}
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={`rounded-xl ${buttonClass}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
