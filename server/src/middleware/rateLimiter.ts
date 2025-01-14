import rateLimit from "express-rate-limit";
import { UPDATE_INTERVAL } from "../utils/constants";

export const requestLimiter = rateLimit({
	windowMs: UPDATE_INTERVAL,
	max: 5,
	keyGenerator: (req) => req.ip || "anonymous",
	message: {
		error: "Пожалуйста, подождите 5 секунд перед следующим обновлением",
	},
});
