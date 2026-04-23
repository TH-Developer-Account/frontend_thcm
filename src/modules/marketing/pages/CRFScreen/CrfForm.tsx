import React from "react";
import { useNavigate } from "react-router-dom";
import { buildLineItemPayload } from "../../constant";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";
import LineItemTable from "../../../../components/ui/LineItemTable";
import type {
	CrfProps,
	Product,
	LineItemOption,
	GroupedOption,
} from "../../types";
import Button from "../../../../components/common/Button";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";

export function CrfProps({ items, onChange, isViewer, options }: CrfProps) {
	const getOptionsByCategory = (category: string): LineItemOption[] => {
		return options.find((group) => group.label === category)?.options ?? [];
	};

	const getItemsByCategory = (category: string) => {
		return items.filter((item) => item.category === category);
	};

	return (
		<React.Fragment>
			<LineItemTable
				title="Printed Materials"
				items={getItemsByCategory("PRINTED_MATERIAL")}
				onChange={onChange}
				particularOptions={getOptionsByCategory("PRINTED_MATERIAL")}
				isViewer={isViewer}
				category="PRINTED_MATERIAL"
			/>
			<LineItemTable
				title="Souveniers"
				items={getItemsByCategory("SOUVENIR")}
				onChange={onChange}
				particularOptions={getOptionsByCategory("SOUVENIR")}
				isViewer={isViewer}
				category="SOUVENIR"
			/>
			<LineItemTable
				title="Artworks"
				items={getItemsByCategory("ARTWORK")}
				onChange={onChange}
				particularOptions={getOptionsByCategory("ARTWORK")}
				isViewer={isViewer}
				category="ARTWORK"
			/>
		</React.Fragment>
	);
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export default function CrfForm() {
	const { showToast } = useToast();
	const navigate = useNavigate();
	const [costItems, setCostItems] = React.useState<LineItemOption[]>([]);
	const [options, setOptions] = React.useState<GroupedOption[]>([]);

	const stored = localStorage.getItem("epcInfo");
	let epcId: string | null = null;
	if (stored) {
		const parsed = JSON.parse(stored);
		epcId = parsed.epcId || null;
	}

	React.useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await ServerAxios.get(
					`/master-data/products?productType=CRF`,
				);

				const data = response.data.data as Product[];

				const groupedOptions: GroupedOption[] = Object.values(
					data.reduce<Record<string, GroupedOption>>((acc, item: Product) => {
						const category = item.category;

						if (!acc[category]) {
							acc[category] = {
								label: category,
								options: [],
							};
						}

						acc[category].options.push({
							value: item.id,
							label: item.name,
							particular: item.name,
							description: item.description,
							rate: parseFloat(item.unitRate),
							quantity: 1,
						});

						return acc;
					}, {}),
				);

				setOptions(groupedOptions);
			} catch (err) {
				console.error("Product search failed:", err);
				setOptions([]);
			}
		};

		fetchProducts();
	}, []);

	const handleSubmit = async () => {
		try {
			if (!epcId) {
				console.error("EPC ID not found in localStorage");
				return;
			}
			const payload = buildLineItemPayload(costItems, { epcId });

			console.log("FINAL PAYLOAD:", payload);

			const {
				data: { message },
			} = await ServerAxios.post("/crf", payload);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			navigate("/marketing/listing");
		} catch (error) {
			console.error("CRF creation failed:", error);
		}
	};
	return (
		<React.Fragment>
			<PageRowSectionLayout
				stickyHeader={true}
				header_children={
					<div className="flex flex-col sm:flex-row sm:justify-between items-end sm:items-center ">
						<PageHeader
							headerText="Collateral Requisition Form (CRF)"
							subtitleText="Manager your Collateral Requisition Form (CRF) details here"
							Icon={ArrowLeft}
							badgeText="EPC Listing"
							path="/marketing/listing"
						/>
						<div className="mx-2 my-4 sm:mx-4 flex flex-col gap-4 items-end overflow-y-auto">
							<p className="page-subtitle">
								<strong>EPC No: </strong>
								<span> {epcId}</span>
							</p>
							<div className="">
								<Button
									status="brand"
									//  onClick={handleSubmit}
									text={"Draft"}
								/>
								<Button
									status="brand"
									onClick={handleSubmit}
									text={"Save"}
									className="ml-2"
								/>
							</div>
						</div>
					</div>
				}
			>
				<CrfProps
					items={costItems}
					onChange={setCostItems}
					isViewer={false}
					options={options}
				/>
			</PageRowSectionLayout>
		</React.Fragment>
	);
}
