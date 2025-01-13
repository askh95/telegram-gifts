import { Link } from "react-router-dom";

export const Footer = () => {
	return (
		<footer className="bg-gray-900 border-t border-gray-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="flex justify-center items-center">
					<Link
						to="/donate"
						className="text-gray-400 hover:text-white transition-colors"
					>
						Donate
					</Link>
				</div>
			</div>
		</footer>
	);
};
