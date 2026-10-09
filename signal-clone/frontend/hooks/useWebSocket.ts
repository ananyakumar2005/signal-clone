"use client";
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { getToken } from "@/lib/auth";
import type { WSEvent } from "@/types";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = useStore((state) => state.currentUser);
  const handleWSEvent = useStore((state) => state.handleWSEvent);

  const connect = useCallback(() => {
    if (!currentUser) return;
    const token = getToken();
    if (!token) return;

    // Close any existing connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const endpoint = `${wsUrl}/ws/${currentUser.id}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        // Connected to real-time stream
      };

      ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);
          handleWSEvent(data);
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        // Reconnect if not closed cleanly
        if (event.code !== 4001 && currentUser) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error("WebSocket connection failure:", err);
    }
  }, [currentUser, handleWSEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendTypingStart = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing.start",
          conversation_id: conversationId,
        })
      );
    }
  }, []);

  const sendTypingStop = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing.stop",
          conversation_id: conversationId,
        })
      );
    }
  }, []);

  const sendReadReceipt = useCallback((messageIds: number[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageIds.length > 0) {
      wsRef.current.send(
        JSON.stringify({
          type: "message.read",
          message_ids: messageIds,
        })
      );
    }
  }, []);

  return {
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
