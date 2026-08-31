import React, { useEffect, useState } from "react";

import gif1 from "../assets/wheel-loader.gif";
import gif2 from "../assets/excavator.gif";
import gif3 from "../assets/backhoe-loader.gif";

const gifs = [gif1, gif2, gif3];

const FullScreenLoader: React.FC = () => {
	const [currentGifIndex, setCurrentGifIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentGifIndex((prev) => (prev + 1) % gifs.length);
		}, 1500);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="loader-fullscreen">
			{/* GIF container */}
			<div className="loader-gif-wrapper">
				<img src={gifs[currentGifIndex]} alt="loader" className="loader-gif" />
			</div>

			<p className="loader-text">Loading ...</p>
		</div>
	);
};

export default FullScreenLoader;
