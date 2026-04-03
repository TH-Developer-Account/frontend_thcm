import { Badge } from "../../../../components/common/Badge";

const BPGenInfo = () => {
	return (
		<div className="bp-gen-info content-box">
			<div className="bp-gen-header">
				<h3>Joe & De Engineers Pvt. Ltd</h3>
				<Badge status="Approved">Active</Badge>
			</div>
			<div className="bp-gen-content">
				<div className="bp-general-info">
					<div className="general-box">
						<div className="gen-info-title">
							<p>Name :</p>
							<p>Email :</p>
							<p>Number :</p>
							<p>Address :</p>
							<p>Status :</p>
						</div>
						<div className="gen-info-value">
							<p>Joe & De Engineers Pvt. Ltd</p>
							<p>joedeengineers@gmail.com</p>
							<p>+91 9876543210</p>
							<p>342, Bandra West, Mumbai</p>
							<p>Active</p>
						</div>
					</div>
					<div className="general-box">
						<div className="gen-info-title">
							<p>Main Contact Person :</p>
							<p>Main Contact Number:</p>
							<p>State :</p>
							<p>City :</p>
							<p>Country :</p>
						</div>
						<div className="gen-info-value">
							<p>John Doe</p>
							<p>+91 9876543210</p>
							<p>Maharashtra</p>
							<p>Mumbai</p>
							<p>India</p>
						</div>
					</div>
					<div className="general-box">
						<div className="gen-info-title">
							<p>Code :</p>
							<p>Zone :</p>
							<p>State :</p>
							<p>City :</p>
							<p>Country :</p>
						</div>
						<div className="gen-info-value">
							<p>J80610</p>
							<p>WEST</p>
							<p>Maharashtra</p>
							<p>Mumbai</p>
							<p>India</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BPGenInfo;
