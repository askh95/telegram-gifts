import { useEffect, useRef, useState } from "react";

interface UseWebSocketProps {
	url: string;
	onMessage: (data: string) => void;
	currentGiftName: string | null;
}

export const useWebSocket = ({
	url,
	onMessage,
	currentGiftName,
}: UseWebSocketProps) => {
	const [status, setStatus] = useState<
		"connecting" | "connected" | "disconnected" | "error"
	>("connecting");
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
	const pingIntervalRef = useRef<NodeJS.Timeout>();
	const retryCountRef = useRef(0);

	const getReconnectDelay = () => {
		const baseDelay = 1000;
		const maxDelay = 30000;
		const delay = Math.min(
			baseDelay * Math.pow(1.5, retryCountRef.current),
			maxDelay
		);
		return delay;
	};

	const cleanup = () => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
		}
	};

	const setupPingPong = () => {
		pingIntervalRef.current = setInterval(() => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send("ping");
			}
		}, 30000);
	};

	const connect = () => {
		try {
			cleanup();

			wsRef.current = new WebSocket(url);

			wsRef.current.onopen = () => {
				setStatus("connected");
				if (currentGiftName) {
					wsRef.current?.send(currentGiftName);
				}
				setupPingPong();
			};

			wsRef.current.onmessage = (event) => {
				if (event.data === "pong") {
					return;
				}
				onMessage(event.data);
			};

			wsRef.current.onclose = () => {
				setStatus("disconnected");
				cleanup();

				reconnectTimeoutRef.current = setTimeout(() => {
					retryCountRef.current += 1;
					connect();
				}, getReconnectDelay());
			};

			wsRef.current.onerror = (error) => {
				console.error("WebSocket error:", error);
				setStatus("error");
			};
		} catch (error) {
			console.error("WebSocket connection error:", error);
			setStatus("error");

			reconnectTimeoutRef.current = setTimeout(() => {
				retryCountRef.current += 1;
				connect();
			}, getReconnectDelay());
		}
	};

	useEffect(() => {
		connect();

		const handleVisibilityChange = () => {
			if (
				document.visibilityState === "visible" &&
				(!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
			) {
				connect();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		window.addEventListener("online", connect);

		return () => {
			cleanup();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("online", connect);
		};
	}, [url, currentGiftName]);

	return { status };
};
