import { Search } from "lucide-react";

interface OwnersSearchProps {
	onSearch: (query: string) => void;
}

export const OwnersSearch = ({ onSearch }: OwnersSearchProps) => {
	return (
		<div className="p-4 border-b border-gray-700">
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Search className="h-5 w-5 text-gray-400" />
				</div>
				<input
					type="text"
					onChange={(e) => onSearch(e.target.value)}
					placeholder="Поиск владельца..."
					className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg 
                    text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                    focus:ring-purple-500/50 focus:border-purple-500"
				/>
			</div>
		</div>
	);
};
