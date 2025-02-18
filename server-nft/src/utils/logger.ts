// src/utils/logger.ts
import chalk from "chalk";

export const logger = {
	info: (message: string) =>
		console.log(
			chalk.blue(`[INFO] ${new Date().toLocaleTimeString()} ${message}`)
		),
	success: (message: string) =>
		console.log(
			chalk.green(`[SUCCESS] ${new Date().toLocaleTimeString()} ${message}`)
		),
	warning: (message: string) =>
		console.log(
			chalk.yellow(`[WARNING] ${new Date().toLocaleTimeString()} ${message}`)
		),
	error: (message: string) =>
		console.log(
			chalk.red(`[ERROR] ${new Date().toLocaleTimeString()} ${message}`)
		),
	progress: (current: number, total: number, message: string) => {
		const percentage = Math.round((current / total) * 100);
		console.log(
			chalk.cyan(
				`[PROGRESS] ${new Date().toLocaleTimeString()} ${message} ${current}/${total} (${percentage}%)`
			)
		);
	},
};
