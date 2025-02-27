// src/components/DonateModal.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Portal from "./Portal";
import DonatePage from "../pages/DonatePage";

interface DonateModalProps {
	onClose: () => void;
}

const DonateModal = ({ onClose }: DonateModalProps) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setTimeout(() => setIsVisible(true), 50);

		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	const handleClose = () => {
		setIsVisible(false);
		setTimeout(onClose, 300);
	};

	return (
		<Portal wrapperId="donate-modal-portal">
			<div
				className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 
          transition-opacity duration-300 ${
						isVisible ? "opacity-100" : "opacity-0"
					}`}
				onClick={handleClose}
			>
				<div
					className={`bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-xl 
            max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto w-full
            transition-all duration-300 ${
							isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
						}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="sticky top-0 z-10 flex justify-between items-center p-3 sm:p-4 bg-gray-800/95 border-b border-gray-700/30">
						<h2 className="text-lg font-medium text-white ml-1">
							Поддержать проект
						</h2>
						<button
							onClick={handleClose}
							className="p-1.5 sm:p-2 hover:bg-gray-700/50 rounded-lg transition-all"
							aria-label="Close modal"
						>
							<X className="w-5 h-5 text-gray-400 hover:text-white" />
						</button>
					</div>

					<div className="p-3 sm:p-4">
						<DonatePage isModal={true} />
					</div>
				</div>
			</div>
		</Portal>
	);
};

export default DonateModal;
