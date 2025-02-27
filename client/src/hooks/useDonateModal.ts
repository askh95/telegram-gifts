// src/hooks/useDonateModal.ts
import { useState, useEffect } from "react";

const DONATE_MODAL_SHOWN_KEY = "donate_modal_shown";

export const useDonateModal = () => {
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		// Check if this is the first visit (modal hasn't been shown yet)
		const hasSeenModal = localStorage.getItem(DONATE_MODAL_SHOWN_KEY);

		if (!hasSeenModal) {
			// Show modal on first visit
			setShowModal(true);
			// Mark that the user has seen the modal
			localStorage.setItem(DONATE_MODAL_SHOWN_KEY, "true");
		}
	}, []);

	const closeModal = () => {
		setShowModal(false);
	};

	const openModal = () => {
		setShowModal(true);
	};

	return { showModal, closeModal, openModal };
};

export default useDonateModal;
