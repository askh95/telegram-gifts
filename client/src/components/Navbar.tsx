import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Gift, BarChart } from "lucide-react";
import logo from "../assets/logo.svg";

export const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<nav className="bg-gray-900/1 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
					<NavLink to="/" className="flex items-center">
						<img
							src={logo}
							alt="Logo"
							className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
						/>
						<span className="ml-2 text-[10px] sm:text-xs font-semibold text-blue-500 bg-blue-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
							BETA
						</span>
					</NavLink>

					<div className="hidden md:flex flex-1 justify-center items-center gap-16">
						<NavLink
							to="/gifts"
							className="text-gray-300 transition-all duration-300 text-xl font-medium hover:scale-110 hover:text-blue-500 flex items-center gap-2"
							style={({ isActive }) => ({
								color: isActive ? "#3B82F6" : "",
							})}
						>
							<Gift className="h-5 w-5" />
							Подарки
						</NavLink>
						<NavLink
							to="/analytics"
							className="text-gray-300 transition-all duration-300 text-xl font-medium hover:scale-110 hover:text-blue-500 flex items-center gap-2"
							style={({ isActive }) => ({
								color: isActive ? "#3B82F6" : "",
							})}
						>
							<BarChart className="h-5 w-5" />
							Аналитика
						</NavLink>
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
					<div className="md:hidden absolute left-0 right-0 top-16 bg-gray-900 border-b border-gray-800">
						<div className="px-4 pt-2 pb-3 space-y-1">
							<NavLink
								to="/gifts"
								className="text-gray-300 flex items-center gap-2  py-2 text-base font-medium hover:bg-gray-700 hover:text-blue-500"
								style={({ isActive }) => ({
									color: isActive ? "#3B82F6" : "",
								})}
								onClick={toggleMobileMenu}
							>
								<Gift className="h-5 w-5" />
								Подарки
							</NavLink>
							<NavLink
								to="/analytics"
								className="text-gray-300 flex items-center gap-2  py-2 text-base font-medium hover:bg-gray-700 hover:text-blue-500"
								style={({ isActive }) => ({
									color: isActive ? "#3B82F6" : "",
								})}
								onClick={toggleMobileMenu}
							>
								<BarChart className="h-5 w-5" />
								Аналитика
							</NavLink>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};
