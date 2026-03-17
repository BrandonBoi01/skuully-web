"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

type UseDashboardLiveArgs = {
  schoolId?: string | null;
  programId?: string | null;
  onRefresh: () => void;
};

export function useDashboardLive({
  schoolId,
  programId,
  onRefresh,
}: UseDashboardLiveArgs) {
  useEffect(() => {
    if (!schoolId && !programId) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const socket: Socket = io(`${baseUrl}/dashboard`, {
      transports: ["websocket"],
      auth: token ? { token } : undefined,
    });

    socket.on("connect", () => {
      socket.emit("dashboard:join", {
        schoolId: schoolId ?? undefined,
        programId: programId ?? undefined,
      });
    });

    socket.on("dashboard:refresh", onRefresh);
    socket.on("dashboard:control-center:refresh", onRefresh);

    socket.on("dashboard:error", (payload) => {
      console.error("Dashboard socket error:", payload);
    });

    return () => {
      socket.off("dashboard:refresh", onRefresh);
      socket.off("dashboard:control-center:refresh", onRefresh);
      socket.disconnect();
    };
  }, [schoolId, programId, onRefresh]);
}