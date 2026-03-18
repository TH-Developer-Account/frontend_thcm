import React from "react";
import Section from "./Section";

const BudgetInfo = () => {
	return (
		<React.Fragment>
			<Section title="Budget Information">
				<div className="row-7 justify-between flex items-center mb-4 epf-budget-card ">
					<p className="font-bold ">
						Budget Code : <span className="font-light">BUD23SAL</span>
					</p>
					<p className="font-bold ">
						Annual Budget : <span className="font-light">9,00,000.00</span>
					</p>
					<p className="font-bold ">
						Available Budget :<span className="font-light ml-2">95,000</span>
					</p>
				</div>
				<div className="row-7 justify-between flex items-center mb-10 epf-budget-card ">
					<p className="font-bold ">
						Budget Description : <span className="font-light">Demo Show</span>
					</p>
					<p className="font-bold ">
						Event Budget : <span className="font-light">83,000.00</span>
					</p>
				</div>
			</Section>
		</React.Fragment>
	);
};

export default BudgetInfo;
