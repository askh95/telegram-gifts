import { useState } from "react";
import { Copy } from "lucide-react";
import type { CryptoAddress, CopySuccessMessage } from "../types/gift";
import ton from "../assets/ton.png";

const DonatePage = () => {
	const [copySuccess, setCopySuccess] = useState<CopySuccessMessage>("");

	const cryptoAddresses: CryptoAddress[] = [
		{
			name: "TON",
			address: "UQDHlCO19Rn821psJKkGEBVZPViE5-ncdZNv4QWyFqyMc6-f",
			shortAddress: "UQDHlCO...yMc6-f",
			color: "#0098c8",
		},
		{
			name: "Telegram Channel",
			special: true,
			color: "#0098c8",
		},
	];

	const handleCopy = async (address: string, name: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(address);
			setCopySuccess(`${name} адрес скопирован`);
			setTimeout(() => setCopySuccess(""), 2000);
		} catch (error) {
			console.error("Failed to copy address:", error);
			setCopySuccess("Ошибка при копировании адреса");
		}
	};

	return (
		<div className="bg-gray-900 text-white">
			{copySuccess && (
				<div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-md">
					<div className="flex items-center gap-2">
						<Copy className="h-5 w-5 text-emerald-400" />
						<span className="font-medium">{copySuccess}</span>
					</div>
				</div>
			)}

			<div className="mx-auto max-w-3xl px-4 py-12">
				<div className="mb-8 text-center">
					<h1 className="mb-4 text-4xl font-bold sm:text-5xl">
						<span className="text-white">Поддержать проект</span>
					</h1>
					<p className="mx-auto max-w-2xl text-gray-400">
						Если вам нравится мой проект, вы можете поддержать его развитие.{" "}
						<br /> Кстати, данный веб-сайт размещён на бесплатном хостинге, и
						мне бы очень помогла ваша поддержка для его переноса на полноценный
						сервер.
					</p>
					<p className="mt-2 text-sm text-gray-500">
						Нажмите на карточку чтобы скопировать адрес
					</p>
				</div>

				<div className="flex flex-col gap-4">
					{cryptoAddresses.map((crypto) => (
						<div
							key={crypto.name}
							onClick={() =>
								!crypto.special &&
								crypto.address &&
								handleCopy(crypto.address, crypto.name)
							}
							className={`relative rounded-xl border p-8 transition-all duration-300
                ${
									crypto.special
										? "border-[#0098c8]/20 bg-gradient-to-br from-[#0098c8]/10 to-[#0098c8]/5 hover:border-[#0098c8]/40 hover:bg-[#0098c8]/10 hover:shadow-[0_0_15px_rgba(0,152,200,0.15)]"
										: "cursor-pointer border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
								}`}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									{crypto.name === "TON" ? (
										<img src={ton} alt="TON" className="h-12 w-12" />
									) : (
										<svg
											viewBox="0 0 24 24"
											className="h-12 w-12"
											style={{ color: crypto.color }}
										>
											<path
												fill="currentColor"
												d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
											/>
										</svg>
									)}
									<h2 className="text-2xl font-semibold">{crypto.name}</h2>
								</div>
								{!crypto.special && (
									<Copy className="h-5 w-5 text-gray-400 transition-colors group-hover:text-white" />
								)}
							</div>
							{crypto.special ? (
								<a
									href="https://t.me/peekNft"
									target="_blank"
									rel="noopener noreferrer"
									className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#0098c8] px-6 py-3 text-base text-white transition-all hover:bg-[#0098c8]/80 group"
								>
									<svg
										stroke="currentColor"
										fill="none"
										strokeWidth="2"
										viewBox="0 0 24 24"
										className="h-5 w-5 transition-transform group-hover:scale-110"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
									</svg>
									<span>Открыть</span>
								</a>
							) : (
								<div className="mt-4 text-base text-gray-400 transition-colors group-hover:text-white">
									{crypto.shortAddress}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default DonatePage;
