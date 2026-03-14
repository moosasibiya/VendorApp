"use client";

import { io, type Socket } from "socket.io-client";
import { getApiOrigin } from "@/lib/api";

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (!socket) {
    socket = io(getApiOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}
