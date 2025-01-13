import { NavLink } from "react-router-dom";

const Analytics = () => {
	return (
		<div className=" w-screen flex justify-center items-center">
			Скоро будет! -
			<span className="text-red-600 hover:text-red-800">
				<NavLink to="/donate">Поддержать</NavLink>
			</span>
		</div>
	);
};

export default Analytics;
