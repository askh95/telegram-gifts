import { useState, useLayoutEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
	children: ReactNode;
	wrapperId?: string;
}

function createWrapperAndAppendToBody(wrapperId: string) {
	const wrapperElement = document.createElement("div");
	wrapperElement.setAttribute("id", wrapperId);
	document.body.append(wrapperElement);
	return wrapperElement;
}

function Portal({ children, wrapperId = "portal-wrapper" }: PortalProps) {
	const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(
		null
	);

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
