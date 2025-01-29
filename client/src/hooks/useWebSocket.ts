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
	const retryCountRef = useRef(0);
	const MAX_RETRIES = 5;

	const cleanup = () => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}
	};

	const connect = () => {
		try {
			cleanup();

			wsRef.current = new WebSocket(url);

			wsRef.current.onopen = () => {
				setStatus("connected");
				retryCountRef.current = 0;
				if (currentGiftName) {
					wsRef.current?.send(currentGiftName);
				}
			};

			wsRef.current.onmessage = (event) => {
				onMessage(event.data);
			};

			wsRef.current.onclose = () => {
				setStatus("disconnected");
				const shouldReconnect = retryCountRef.current < MAX_RETRIES;
				if (shouldReconnect) {
					reconnectTimeoutRef.current = setTimeout(() => {
						retryCountRef.current += 1;
						connect();
					}, 2000);
				}
			};

			wsRef.current.onerror = () => {
				setStatus("error");
			};
		} catch (error) {
			console.error("WebSocket connection error:", error);
			setStatus("error");
		}
	};

	useEffect(() => {
		connect();

		return cleanup;
	}, [url, currentGiftName]);

	return { status };
};
