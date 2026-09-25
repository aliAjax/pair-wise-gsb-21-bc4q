// 保存层：界面访问状态的 hook 入口

import { useSyncExternalStore } from "react";
import { dispatch, getSnapshot, subscribe } from "./store";
import type { AppState } from "../data/types";

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export { dispatch };
