import React, { useEffect, useState } from "react";

import gif1 from "../assets/wheel-loader.gif";
import gif2 from "../assets/excavator.gif";
import gif3 from "../assets/backhoe-loader.gif";

const gifs = [gif1, gif2, gif3];

const prefersReducedMotion = () =>
	typeof window !== "undefined" &&
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const FullScreenLoader: React.FC = () => {
	const [currentGifIndex, setCurrentGifIndex] = useState(0);

	useEffect(() => {
		// Don't cycle the machines for users who asked for less motion.
		if (prefersReducedMotion()) return;

		const interval = setInterval(() => {
			setCurrentGifIndex((prev) => (prev + 1) % gifs.length);
		}, 1500);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className="loader-fullscreen"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="loader-gif-wrapper" aria-hidden="true">
				<img src={gifs[currentGifIndex]} alt="" className="loader-gif" />
			</div>

			<p className="loader-text">Loading…</p>
		</div>
	);
};

export default FullScreenLoader;
