import React from "react";
import Section from "./Section";

const Participants = () => {
	return (
		<React.Fragment>
			<Section title="Participants">
				<div className="row-7 justify-between flex items-center mb-8 epf-budget-card ">
					<p className="font-bold ">
						Internal : <span className="font-light">50</span>
					</p>
					<p className="font-bold ">
						External :<span className="font-light ml-2">50</span>
					</p>
					<p className="font-bold ">
						Total : <span className="font-light">100</span>
					</p>
				</div>
			</Section>
		</React.Fragment>
	);
};

export default Participants;
