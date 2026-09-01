import type { BPContactViewModel } from "../hooks/useBusinessPartners";
import MainContactCurrentCard from "./MainContactCurrentCard";

const BPMainContact = ({ contacts }: { contacts: BPContactViewModel[] }) => (
	<div className="bp-gen-content">
		<MainContactCurrentCard contacts={contacts} fallbackValue="--" />
	</div>
);

export default BPMainContact;
