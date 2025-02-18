import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Gift, Activity, Star } from "lucide-react";
import logo from "../assets/logo.svg";

export const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/1 backdrop-blur-sm">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between sm:h-20 md:h-24">
					<NavLink to="/" className="flex items-center">
						<img
							src={logo}
							alt="Logo"
							className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
						/>
						<span className="ml-2 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-500 sm:px-2 sm:py-1 sm:text-xs">
							BETA
						</span>
					</NavLink>

					<div className="hidden md:flex flex-1 justify-center items-center gap-16">
						<NavLink
							to="/gifts"
							className="flex items-center gap-2 text-xl font-medium text-gray-300 transition-all duration-300 hover:scale-110 hover:text-blue-500"
							style={({ isActive }) => ({
								color: isActive ? "#3B82F6" : "",
							})}
						>
							<Gift className="h-5 w-5" />
							Подарки
						</NavLink>
						<NavLink
							to="/monitor"
							className="flex items-center gap-2 text-xl font-medium text-gray-300 transition-all duration-300 hover:scale-110 hover:text-blue-500"
							style={({ isActive }) => ({
								color: isActive ? "#3B82F6" : "",
							})}
						>
							<Activity className="h-5 w-5" />
							Мониторинг
						</NavLink>
						<NavLink
							to="/nft"
							className="flex items-center gap-2 text-xl font-medium text-gray-300 transition-all duration-300 hover:scale-110 hover:text-blue-500"
							style={({ isActive }) => ({
								color: isActive ? "#3B82F6" : "",
							})}
						>
							<Star className="h-5 w-5" />
							NFT
						</NavLink>
						<a
							href="https://t.me/giftsanalyz"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-xl font-medium text-gray-300 transition-all duration-300 hover:scale-110 hover:text-[#0098c8]"
						>
							<svg
								viewBox="0 0 24 24"
								className="h-5 w-5"
								style={{ color: "#0098c8" }}
							>
								<path
									fill="currentColor"
									d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
								/>
							</svg>
							Telegram
						</a>
					</div>

					<div className="md:hidden">
						<button
							onClick={toggleMobileMenu}
							className="text-gray-300 focus:outline-none"
						>
							{isMobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{isMobileMenuOpen && (
					<div className="absolute left-0 right-0 top-16 border-b border-gray-800 bg-gray-900 md:hidden">
						<div className="space-y-1 px-4 pb-3 pt-2">
							<NavLink
								to="/gifts"
								className="flex items-center gap-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-blue-500"
								style={({ isActive }) => ({
									color: isActive ? "#3B82F6" : "",
								})}
								onClick={toggleMobileMenu}
							>
								<Gift className="h-5 w-5" />
								Подарки
							</NavLink>
							<NavLink
								to="/monitor"
								className="flex items-center gap-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-blue-500"
								style={({ isActive }) => ({
									color: isActive ? "#3B82F6" : "",
								})}
							>
								<Activity className="h-5 w-5" />
								Мониторинг
							</NavLink>
							<NavLink
								to="/nft"
								className="flex items-center gap-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-blue-500"
								style={({ isActive }) => ({
									color: isActive ? "#3B82F6" : "",
								})}
								onClick={toggleMobileMenu}
							>
								<Star className="h-5 w-5" />
								NFT
							</NavLink>
							<a
								href="https://t.me/giftsanalyz"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-[#0098c8]"
								onClick={toggleMobileMenu}
							>
								<svg
									viewBox="0 0 24 24"
									className="h-5 w-5"
									style={{ color: "#0098c8" }}
								>
									<path
										fill="currentColor"
										d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
									/>
								</svg>
								Telegram
							</a>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
