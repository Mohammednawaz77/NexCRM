import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message:", data);

          switch (data.type) {
            case "lead_created":
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              toast({
                title: "New lead created",
                description: "A new lead has been added to the system",
              });
              break;
            case "lead_updated":
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              break;
            case "lead_deleted":
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              toast({
                title: "Lead deleted",
                description: "A lead has been removed from the system",
              });
              break;
            case "activity_created":
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              toast({
                title: "New activity",
                description: "An activity has been logged",
              });
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        
        reconnectTimeout.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 5000);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { connected, ws: ws.current };
}
