import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Portal from "./Portal";
import { formatGiftName } from "../utils/formatGiftName";

interface OptionProps {
	value: string;
	label: string;
	icon?: React.ReactNode;
}

interface CustomDropdownProps {
	options: OptionProps[];
	value: string | null;
	onChange: (value: string | null) => void;
	placeholder: string;
	title?: string;
	disabled?: boolean;
	loading?: boolean;
	className?: string;
	showAllOption?: boolean;
	allOptionLabel?: string;
	searchable?: boolean;
	noOptionsMessage?: string;
	visualModeOnMobile?: boolean;
}

const CustomDropdown = ({
	options,
	value,
	onChange,
	placeholder,
	title,
	disabled = false,
	loading = false,
	className = "",
	showAllOption = false,
	allOptionLabel = "Все",
	searchable = false,
	noOptionsMessage = "Нет доступных опций",
	visualModeOnMobile = false,
}: CustomDropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [isMobile, setIsMobile] = useState(false);

	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((option) => option.value === value);

	const filteredOptions =
		searchQuery.trim() === ""
			? options
			: options.filter(
					(option) =>
						option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
						formatGiftName(option.label)
							.toLowerCase()
							.includes(searchQuery.toLowerCase())
			  );

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1280);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (visualModeOnMobile && isMobile) {
				if (
					modalRef.current &&
					!modalRef.current.contains(event.target as Node)
				) {
					setIsOpen(false);
					setSearchQuery("");
				}
			} else {
				if (
					dropdownRef.current &&
					!dropdownRef.current.contains(event.target as Node) &&
					buttonRef.current &&
					!buttonRef.current.contains(event.target as Node)
				) {
					setIsOpen(false);
					setSearchQuery("");
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [visualModeOnMobile, isMobile]);

	useEffect(() => {
		if (isOpen && searchable && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen, searchable]);

	useEffect(() => {
		setHighlightedIndex(0);
	}, [filteredOptions]);

	const handleOptionClick = (option: OptionProps) => {
		onChange(option.value === value ? null : option.value);
		setIsOpen(false);
		setSearchQuery("");
	};

	const handleToggle = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
			if (!isOpen) {
				setSearchQuery("");
			}
		}
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return;

		const optionsCount = (showAllOption ? 1 : 0) + filteredOptions.length;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) => (prev + 1) % optionsCount);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) => (prev - 1 + optionsCount) % optionsCount);
				break;
			case "Enter":
				e.preventDefault();
				if (highlightedIndex === 0 && showAllOption) {
					onChange(null);
					setIsOpen(false);
					setSearchQuery("");
				} else {
					const selectedIndex = showAllOption
						? highlightedIndex - 1
						: highlightedIndex;
					if (filteredOptions[selectedIndex]) {
						handleOptionClick(filteredOptions[selectedIndex]);
					}
				}
				break;
			case "Escape":
				e.preventDefault();
				setIsOpen(false);
				setSearchQuery("");
				break;
		}
	};

	const getDropdownPosition = () => {
		if (!buttonRef.current) return { top: 0, left: 0, width: 0 };

		const rect = buttonRef.current.getBoundingClientRect();
		const windowHeight = window.innerHeight;
		const spaceBelow = windowHeight - rect.bottom;

		const showAbove = spaceBelow < 300 && rect.top > 300;

		return {
			top: showAbove ? rect.top - 10 : rect.bottom + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
			showAbove,
		};
	};

	const getDisplayLabel = (option?: OptionProps) => {
		if (!option) return placeholder;

		const isGiftName =
			option.value && !option.value.includes("-") && /[A-Z]/.test(option.value);
		return isGiftName ? formatGiftName(option.label) : option.label;
	};

	const useVisualMode = visualModeOnMobile && isMobile;

	if (!useVisualMode) {
		const { top, left, width, showAbove } = getDropdownPosition();

		return (
			<div className={`relative ${className}`}>
				<button
					ref={buttonRef}
					type="button"
					className={`relative flex items-center justify-between w-full p-2 md:p-3 rounded-lg border text-left ${
						disabled
							? "bg-gray-700/50 text-gray-500 border-gray-700/30 cursor-not-allowed"
							: "bg-gray-800/50 text-white border-gray-700/50 hover:bg-gray-700/60"
					} transition-colors duration-200`}
					onClick={handleToggle}
					disabled={disabled}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
				>
					<div className="flex items-center flex-grow">
						{selectedOption ? (
							<>
								{selectedOption.icon && (
									<div className="flex-shrink-0 hidden sm:block">
										{selectedOption.icon}
									</div>
								)}
								<span className="ml-0 sm:ml-2 text-xs sm:text-sm md:text-base truncate">
									{getDisplayLabel(selectedOption)}
								</span>
							</>
						) : (
							<span className="text-gray-400 text-xs sm:text-sm md:text-base">
								{placeholder}
							</span>
						)}
					</div>
					<div className="flex items-center">
						{loading ? (
							<svg
								className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
							<svg
								className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						)}
					</div>
				</button>

				{isOpen && (
					<Portal
						wrapperId={`dropdown-portal-${title || placeholder}`}
						lockScroll={false}
					>
						<div
							ref={dropdownRef}
							className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50 max-w-[calc(100vw-2rem)] ${
								showAbove ? "mb-1" : "mt-1"
							}`}
							style={{
								position: "absolute",
								top: showAbove ? undefined : `${top}px`,
								bottom: showAbove ? `${window.innerHeight - top}px` : undefined,
								left: `${Math.max(10, left)}px`,
								width: `${Math.min(width, window.innerWidth - 20)}px`,
								maxHeight: "60vh",
								zIndex: 9999,
								transform: showAbove ? "translateY(-100%)" : "none",
							}}
							onKeyDown={handleKeyDown}
							role="listbox"
						>
							{searchable && (
								<div className="p-2 border-b border-gray-700/50">
									<div className="relative">
										<input
											ref={searchInputRef}
											type="text"
											value={searchQuery}
											onChange={handleSearchChange}
											placeholder="Поиск..."
											className="w-full bg-gray-700/40 border border-gray-600/50 rounded-md py-1.5 md:py-2 pl-6 sm:pl-7 md:pl-8 pr-2 md:pr-3 text-xs sm:text-xs md:text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
										/>
										<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-400" />
									</div>
								</div>
							)}

							<div className="max-h-60 overflow-y-auto overscroll-contain">
								{showAllOption && (
									<div
										className={`flex items-center p-2 md:p-3 cursor-pointer hover:bg-gray-700/60 transition-colors duration-150 ${
											value === null ? "bg-gray-700/40" : ""
										}`}
										onClick={() => {
											onChange(null);
											setIsOpen(false);
											setSearchQuery("");
										}}
										role="option"
										aria-selected={value === null}
									>
										<span className="ml-2 text-xs sm:text-sm md:text-base">
											{allOptionLabel}
										</span>
									</div>
								)}

								{filteredOptions.length === 0 ? (
									<div className="p-2 md:p-3 text-gray-400 text-center text-xs sm:text-sm">
										{noOptionsMessage}
									</div>
								) : (
									filteredOptions.map((option) => (
										<div
											key={option.value}
											className={`flex items-center p-2 md:p-3 cursor-pointer hover:bg-gray-700/60 transition-colors duration-150 ${
												option.value === value ? "bg-gray-700/40" : ""
											}`}
											onClick={() => handleOptionClick(option)}
											role="option"
											aria-selected={option.value === value}
										>
											{option.icon && (
												<div className="flex-shrink-0 mr-3 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
													{option.icon}
												</div>
											)}
											<span className="text-xs sm:text-sm md:text-base truncate max-w-[calc(100%-36px)]">
												{option.value &&
												!option.value.includes("-") &&
												/[A-Z]/.test(option.value)
													? formatGiftName(option.label)
													: option.label}
											</span>
										</div>
									))
								)}
							</div>
						</div>
					</Portal>
				)}
			</div>
		);
	}

	return (
		<div className={`relative ${className}`}>
			<button
				ref={buttonRef}
				type="button"
				className={`flex items-center justify-between w-full p-2 md:p-3 rounded-lg border text-left ${
					disabled
						? "bg-gray-700/50 text-gray-500 border-gray-700/30 cursor-not-allowed"
						: "bg-gray-800/50 text-white border-gray-700/50 hover:bg-gray-700/60"
				} transition-colors duration-200`}
				onClick={handleToggle}
				disabled={disabled}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
			>
				<div className="flex items-center flex-grow">
					{selectedOption ? (
						<>
							{selectedOption.icon && (
								<div className="flex-shrink-0 block max-w-[20px] sm:max-w-none">
									{selectedOption.icon}
								</div>
							)}
							<span className="ml-3 sm:ml-3 text-xs sm:text-sm md:text-base truncate max-w-[70%]">
								{getDisplayLabel(selectedOption)}
							</span>
						</>
					) : (
						<span className="text-gray-400 text-xs sm:text-sm md:text-base">
							{placeholder}
						</span>
					)}
				</div>
				<div className="flex items-center">
					{loading ? (
						<svg
							className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					) : (
						<svg
							className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							></path>
						</svg>
					)}
				</div>
			</button>

			{isOpen && (
				<Portal
					wrapperId={`modal-dropdown-${title || placeholder}`}
					lockScroll={true}
				>
					<div
						className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center py-16 px-4"
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
					>
						<div
							ref={modalRef}
							className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn"
							style={{
								animation: "fadeIn 0.15s ease-out",
							}}
						>
							<div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
								<h2
									id="modal-title"
									className="text-base sm:text-lg font-semibold text-white"
								>
									{title || placeholder}
								</h2>
								<button
									onClick={() => {
										setIsOpen(false);
										setSearchQuery("");
									}}
									className="text-gray-400 hover:text-white transition-colors"
								>
									<X className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>

							{searchable && (
								<div className="p-3 border-b border-gray-700/50">
									<div className="relative">
										<input
											ref={searchInputRef}
											type="text"
											value={searchQuery}
											onChange={handleSearchChange}
											placeholder="Поиск..."
											className="w-full bg-gray-700/40 border border-gray-600/50 rounded-md py-1.5 sm:py-2 pl-7 sm:pl-8 pr-2 sm:pr-3 text-xs sm:text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
										/>
										<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
									</div>
								</div>
							)}

							<div
								className="overflow-y-auto flex-grow"
								style={{ maxHeight: "calc(100vh - 200px)" }}
							>
								{showAllOption && (
									<div
										className="flex items-center p-2.5 sm:p-3 border-b border-gray-700/20 cursor-pointer hover:bg-gray-700/40"
										onClick={() => {
											onChange(null);
											setIsOpen(false);
											setSearchQuery("");
										}}
									>
										<div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded border border-gray-500 mr-2 sm:mr-3 flex-shrink-0">
											{value === null && (
												<div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-sm"></div>
											)}
										</div>
										<span className="text-xs sm:text-sm">{allOptionLabel}</span>
									</div>
								)}

								{filteredOptions.length === 0 ? (
									<div className="p-3 sm:p-4 text-gray-400 text-center text-xs sm:text-sm">
										{noOptionsMessage}
									</div>
								) : (
									filteredOptions.map((option) => (
										<div
											key={option.value}
											className="flex items-center p-2.5 sm:p-3 border-b border-gray-700/20 cursor-pointer hover:bg-gray-700/40"
											onClick={() => handleOptionClick(option)}
										>
											<div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded border border-gray-500 mr-2 sm:mr-3 flex-shrink-0">
												{option.value === value && (
													<div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-sm"></div>
												)}
											</div>
											<div className="flex items-center flex-1">
												{option.icon && (
													<div className="flex-shrink-0 mr-3  flex items-center justify-center">
														{option.icon}
													</div>
												)}
												<span className="truncate text-xs sm:text-sm max-w-[calc(100%-36px)]">
													{option.value &&
													!option.value.includes("-") &&
													/[A-Z]/.test(option.value)
														? formatGiftName(option.label)
														: option.label}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
};

export default CustomDropdown;
