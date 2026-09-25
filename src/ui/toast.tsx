// 界面层：轻提示 hook

import { useCallback, useRef, useState } from "react";
import { Toast } from "./components/Common";

export type ToastApi = (text: string, kind?: "ok" | "err") => void;

export function useToast(): { toast: ToastApi; node: React.ReactNode } {
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback<ToastApi>((text, kind = "ok") => {
    setMsg({ text, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  }, []);

  return { toast, node: msg ? <Toast text={msg.text} kind={msg.kind} /> : null };
}
