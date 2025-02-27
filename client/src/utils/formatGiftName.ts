export const formatGiftName = (giftName: string): string => {
	if (giftName === "DurovsCap") return "Durov's Cap";
	if (giftName === "BDayCandle") return "B-Day Candle";

	return giftName.replace(/([A-Z])/g, " $1").trim();
};
