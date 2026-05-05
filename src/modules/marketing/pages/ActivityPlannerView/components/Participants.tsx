import React from "react";

type ParticipantsProps = {
	internal?: string;
	external?: string;
};

const Participants = ({ internal, external }: ParticipantsProps) => {
	const total = (Number(internal) || 0) + (Number(external) || 0);
	return (
		<React.Fragment>
			<div className="grid grid-cols-3 gap-6 text-sm p-3">
				<div className="light-blue-bg-header"></div>
				<p className="uppercase-label-text">
					Internal :{" "}
					<span className="text-gray-700 leading-relaxed text-xs">
						{internal}
					</span>
				</p>
				<p className="uppercase-label-text">
					External :
					<span className="text-gray-700 leading-relaxed text-xs">
						{external}
					</span>
				</p>
				<p className="uppercase-label-text">
					Total :{" "}
					<span className="text-gray-700 leading-relaxed text-xs">{total}</span>
				</p>
			</div>
		</React.Fragment>
	);
};

export default Participants;
