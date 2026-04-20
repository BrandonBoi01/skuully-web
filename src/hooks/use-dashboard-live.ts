"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

type UseDashboardLiveArgs = {
  institutionId?: string | null;
  onRefresh: () => void;
};

export function useDashboardLive({
  institutionId,
  onRefresh,
}: UseDashboardLiveArgs) {
  useEffect(() => {
    if (!institutionId) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    const socket: Socket = io(`${baseUrl}/dashboard`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("dashboard:join", {
        institutionId,
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
  }, [institutionId, onRefresh]);
}