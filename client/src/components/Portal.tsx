import { useState, useLayoutEffect, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
	children: ReactNode;
	wrapperId?: string;
	lockScroll?: boolean;
}

function createWrapperAndAppendToBody(wrapperId: string) {
	const wrapperElement = document.createElement("div");
	wrapperElement.setAttribute("id", wrapperId);
	document.body.append(wrapperElement);
	return wrapperElement;
}

function Portal({
	children,
	wrapperId = "portal-wrapper",
	lockScroll = false,
}: PortalProps) {
	const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(
		null
	);

	const [_, setOriginalStyles] = useState({
		overflow: "",
		paddingRight: "",
	});

	useEffect(() => {
		if (lockScroll) {
			const scrollbarWidth =
				window.innerWidth - document.documentElement.clientWidth;
			const originalOverflow = document.body.style.overflow;
			const originalPaddingRight = document.body.style.paddingRight;

			setOriginalStyles({
				overflow: originalOverflow,
				paddingRight: originalPaddingRight,
			});

			document.body.style.paddingRight = `${scrollbarWidth}px`;
			document.body.style.overflow = "hidden";

			return () => {
				document.body.style.overflow = originalOverflow;
				document.body.style.paddingRight = originalPaddingRight;
			};
		}
	}, [lockScroll]);

	useLayoutEffect(() => {
		let element = document.getElementById(wrapperId);
		let created = false;

		if (!element) {
			created = true;
			element = createWrapperAndAppendToBody(wrapperId);
		}

		setWrapperElement(element);

		return () => {
			if (created && element) {
				element.remove();
			}
		};
	}, [wrapperId]);

	if (!wrapperElement) return null;

	return createPortal(children, wrapperElement);
}

export default Portal;
