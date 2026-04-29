import React from "react";

type ParticipantsProps = {
	internal?: string;
	external?: string;
};

const Participants = ({ internal, external }: ParticipantsProps) => {
	const total = (Number(internal) || 0) + (Number(external) || 0);
	return (
		<React.Fragment>
			<div className="row-7 justify-between flex items-center p-2">
				<p className="font-bold ">
					Internal : <span className="font-light">{internal}</span>
				</p>
				<p className="font-bold ">
					External :<span className="font-light ml-2">{external}</span>
				</p>
				<p className="font-bold ">
					Total : <span className="font-light">{total}</span>
				</p>
			</div>
		</React.Fragment>
	);
};

export default Participants;
