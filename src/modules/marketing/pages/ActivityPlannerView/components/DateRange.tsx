import React from "react";
import Section from "./Section";

const DateRange = () => {
	return (
		<React.Fragment>
			<Section title="Duration">
				<div className="bg-gray-50 rounded-lg p-4">
					<div className="mx-auto">
						<div className="flex items-center justify-between">
							{/* FROM */}
							<div className="text-left">
								<p className="text-xs text-gray-400 tracking-widest">FROM</p>
								<p className="text-lg font-semibold">12 / 03 / 2027</p>
							</div>

							{/* CENTER */}
							<div className="flex-1 flex items-center justify-center">
								<div className="relative w-40 flex items-center">
									{/* Line */}
									<div className="w-full h-px bg-gray-300"></div>

									{/* Arrow head */}
									<div className="absolute right-0 w-2 h-2 border-t border-r border-gray-400 rotate-45"></div>

									{/* Badge */}
									<div
										className="absolute left-1/2 -translate-x-1/2 -top-3 
														bg-white border text-xs px-3 py-1 rounded-full shadow-sm"
									>
										2 days
									</div>
								</div>
							</div>

							{/* TO */}
							<div className="text-right">
								<p className="text-xs text-gray-400 tracking-widest">TO</p>
								<p className="text-lg font-semibold">14 / 03 / 2027</p>
							</div>
						</div>
					</div>
				</div>
			</Section>
		</React.Fragment>
	);
};

export default DateRange;
