import React, { useEffect, useState } from "react";

import gif1 from "../../assets/wheel-loader.gif";
import gif2 from "../../assets/excavator.gif";
import gif3 from "../../assets/backhoe-loader.gif";

const gifs = [gif1, gif2, gif3];

const FullScreenLoader: React.FC = () => {
	const [currentGifIndex, setCurrentGifIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentGifIndex((prev) => (prev + 1) % gifs.length);
		}, 1500); // change gif every 1.5 seconds

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
			{/* GIF container */}
			<div className="flex items-center justify-center">
				<img
					src={gifs[currentGifIndex]}
					alt="loader"
					className="w-28 h-28 object-contain"
				/>
			</div>

			<p className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">
				Loading ...
			</p>
		</div>
	);
};

export default FullScreenLoader;
