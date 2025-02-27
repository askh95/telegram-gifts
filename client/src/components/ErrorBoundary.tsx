// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error("Error in component:", error, errorInfo);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="p-4 bg-red-500/10 rounded-lg text-red-400 text-sm">
						Что-то пошло не так при отображении компонента
					</div>
				)
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
