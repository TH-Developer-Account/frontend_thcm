import {
	Check,
	ClipboardCheck,
	ListTree,
	TrendingUp,
	type LucideIcon,
} from "lucide-react";

import type { ChecklistCardProps } from "../shared/checklist/ChecklistCard";
import type { ChecklistTemplate as ChecklistTemplateDetail } from "./dealer-audit.types";

export type ChecklistFilter = "all" | "published" | "draft";

export type ChecklistSummary = {
	id: string;
	label: string;
	value: number;
	Icon: LucideIcon;
};

export type ChecklistFacilityType = "HEAD_OFFICE" | "BRANCH_OFFICE";

export type ChecklistTemplateParameter = {
	id: string;
	function: string;
	category: string;
	parameter: string;
	criteria: readonly string[];
};

export type ChecklistTemplate = Omit<
	ChecklistCardProps,
	"onOpen" | "onOpenActions" | "actions"
> & {
	category: string;
	name?: string;
	ownerSearchText: string;
	parametersByFacility?: Partial<
		Record<ChecklistFacilityType, readonly ChecklistTemplateParameter[]>
	>;
};

export const CHECKLIST_FILTER_TABS: Array<{
	label: string;
	value: ChecklistFilter;
}> = [
	{ label: "All", value: "all" },
	{ label: "Published", value: "published" },
	{ label: "Drafts", value: "draft" },
];

export const CHECKLIST_SUMMARY: readonly ChecklistSummary[] = [
	{ id: "active", label: "Active templates", value: 12, Icon: Check },
	{ id: "sections", label: "Total sections", value: 84, Icon: ListTree },
	{
		id: "points",
		label: "Inspection points",
		value: 426,
		Icon: ClipboardCheck,
	},
	{ id: "usage", label: "Used this month", value: 7, Icon: TrendingUp },
] as const;

export const FACILITY_INFRASTRUCTURE_PARAMETERS = {
	HEAD_OFFICE: [
		{
			id: "head-office-01-reception-counter",
			function: "Common",
			category: "Infra",
			parameter: "Reception Counter",
			criteria: [
				"Reception Table & Tata Hitachi Backdrop",
				"As per DIM = 5",
				"With branding (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-02-customer-discussion-room",
			function: "Common",
			category: "Infra",
			parameter: "Customer Discussion Room",
			criteria: [
				"Clearly Demarcated Room",
				"As per DIM = 5",
				"Not as per DIM, but well maintained = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-03-customer-seating-area",
			function: "Common",
			category: "Infra",
			parameter: "Customer Seating Area",
			criteria: [
				"Availability of Sofa",
				"As per DIM = 5",
				"Not as per DIM, but well maintained = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-04-spare-parts-counter",
			function: "Common",
			category: "Infra",
			parameter: "Spare Parts Counter",
			criteria: [
				"Clearly Demarcated with Industrial Chairs",
				"As per DIM = 5",
				"With branding & chairs (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-05-managers-area",
			function: "Common",
			category: "Infra",
			parameter: "Managers Area",
			criteria: [
				"Clearly Demarcated Area for each function",
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "head-office-06-workstation-for-sales-service-personnel",
			function: "Common",
			category: "Infra",
			parameter: "Workstation for Sales & Service personnel",
			criteria: [
				"As per employees based at location",
				"50% = 5",
				"40-49% = 4",
				"30-39% = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-07-toilet",
			function: "Common",
			category: "Infra",
			parameter: "Toilet",
			criteria: [
				"Inspect",
				"Separate = 5",
				"Unisex = 3",
				"Unhygenic (both above cases) = 0",
				"Not available = 0",
			],
		},
		{
			id: "head-office-08-signage-full-length-of-frontage",
			function: "Common",
			category: "Infra",
			parameter: "Signage (full length of frontage)",
			criteria: ["Inspect Availability", "As Per DIM = 5", "Else = 0"],
		},
		{
			id: "head-office-09-fa-ade",
			function: "Common",
			category: "Infra",
			parameter: "Façade",
			criteria: [
				"Inspect Availability",
				"ACP façade as per DIM = 5",
				"ACP façade not as per DIM = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-10-pylon-pole-signage-projection-signage",
			function: "Common",
			category: "Infra",
			parameter: "Pylon/Pole signage / Projection signage",
			criteria: ["Inspect Availability", "As per DIM = 5", "Else = 0"],
		},
		{
			id: "head-office-11-brochure-stand",
			function: "Sales",
			category: "Infra",
			parameter: "Brochure Stand",
			criteria: [
				"Available & should be visible & accesible to customers",
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "head-office-12-brochures-10-each-tmx20-zx33u-ex70-ex110-zx120-ex2",
			function: "Sales",
			category: "Infra",
			parameter:
				"Brochures : 10 each\nTMX20|ZX33U|EX70|EX110|ZX120|EX200|EX210|ZX220|TH76|TH86|TWL3034|TL360Z|Daemo|NPK",
			criteria: ["Present in Brochure stand", "Yes = 5", "No = 0"],
		},
		{
			id: "head-office-13-separate-storage-space-for-failed-parts-handling",
			function: "Service",
			category: "Infra",
			parameter: "Separate Storage Space for Failed Parts Handling",
			criteria: [
				'Physical verification of clearly demarcated space (paint or barricade) with Sticker of "Failed Parts"\n\nMinimum 100 Sqft',
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "head-office-14-field-diagnostic-vehicle-fdv-as-per-dealership-ide",
			function: "Service",
			category: "Infra",
			parameter:
				"Field Diagnostic Vehicle (FDV) as per Dealership Identity Manual",
			criteria: ["Certified by Dealer Development", "As per certificate"],
		},
		{
			id: "head-office-15-4-wheeler-with-working-condition",
			function: "Service",
			category: "Infra",
			parameter: "4 wheeler with working condition.",
			criteria: [
				"Condition and Branding of vehicle as per DIM",
				"Conditon  Branding",
				"Good  Yes = 5",
				"Good  No = 4",
				"Average  Yes = 3",
				"Average  No = 2",
				"Else = 0",
			],
		},
		{
			id: "head-office-16-spare-parts-store-area-closed-demarcated-open",
			function: "Parts",
			category: "Infra",
			parameter: "Spare parts store area (ClosedDemarcated Open)",
			criteria: [
				"Main Warehouse\nPopulation | Sq.ft\n1-200 : 500\n201-350 : 1000\n350-500 : 1500\n>500 : 2000\n\nBranch : 200sq.ft",
				"As per requirement : 5",
				"25% deviation : 3",
				"Else : 0",
			],
		},
		{
			id: "head-office-17-steel-racks",
			function: "Parts",
			category: "Infra",
			parameter: "Steel Racks",
			criteria: [
				"Parts segregated in Bins with the same Pigeon Hole",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "head-office-18-pallets-for-heavy-parts",
			function: "Parts",
			category: "Infra",
			parameter: "Pallets for Heavy Parts",
			criteria: [
				"Heavy Parts (GET's, Pins, Aggregates) should be kept on Pallets (not on ground/floor)",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "head-office-19-storage-area",
			function: "Parts",
			category: "Infra",
			parameter: "Storage area",
			criteria: [
				"Dust-free, Cobweb-free & Direct Sunlight-free",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "head-office-20-branding-of-racks-and-bins-as-per-dim",
			function: "Parts",
			category: "Infra",
			parameter: "Branding of racks and bins as per DIM",
			criteria: [
				"As per DIM & Dust-free & Cobweb free",
				"Yes=5",
				"Not as per DIM, but neatly maintained=3",
				"No=0",
			],
		},
		{
			id: "head-office-21-branding-and-signage-s-of-parts-counter-as-per-dea",
			function: "Parts",
			category: "Infra",
			parameter:
				"Branding and signage's of Parts counter as per Dealership Identity Manual",
			criteria: [
				"Reception Table & Tata Hitachi Backdrop",
				"As per DIM = 5",
				"With branding (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "head-office-22-storage-location-for-lubes",
			function: "Parts",
			category: "Infra",
			parameter: "Storage location for Lubes",
			criteria: ["Demarcated location", "Yes=5", "No=0"],
		},
		{
			id: "head-office-23-front-fa-ade",
			function: "Common",
			category: "Infra",
			parameter: "Front Façade",
			criteria: [
				"Signage (full length of frontage)\nClean & Tidy\nLighting Functional",
				"Not Available: 0",
				"Available: 0-5(As per inspection)",
			],
		},
		{
			id: "head-office-24-pylon-pole-signage-projection-signage",
			function: "Common",
			category: "Infra",
			parameter: "Pylon/Pole signage / Projection signage",
			criteria: [
				"Clean & Tidy \nLighting Functional\nVisible from a distance",
				"Not Available: 0",
				"Available: 0-5(As per inspection)",
			],
		},
		{
			id: "head-office-25-conference-hall",
			function: "Common",
			category: "Infra",
			parameter: "Conference Hall",
			criteria: [
				"Clean & Tidy\nAvailability of Projector/TV/Marker",
				"Not Available: 0",
				"Available: 0-5(As per inspection)",
			],
		},
		{
			id: "head-office-26-experience-zone",
			function: "Common",
			category: "Infra",
			parameter: "Experience Zone",
			criteria: [
				"Availability of TV/Projector\nAvailability of Laptop\nAvailability of Sofa Set\nAvailability of product videos and visitors book\nAesthitic of room-Clean,Tidy,Vibrant \nEZ-Incharge",
				"Not Available: 0",
				"Available: 0-5(As per inspection)",
			],
		},
		{
			id: "head-office-27-machine-display-area",
			function: "Common",
			category: "Infra",
			parameter: "Machine display area",
			criteria: [
				"Clear Demarcated Area\nMachine displayed-Yes or No\nClear Demarcation of Walk around area",
				"Not Available: 0",
				"Available: 0-5(As per inspection)",
			],
		},
		{
			id: "head-office-28-display-of-organization-chart-with-photograph-role",
			function: "Common",
			category: "Infra",
			parameter:
				"Display of Organization Chart with Photograph, Roles & Responsibilities",
			criteria: ["Refer Organisation Structure", "Yes = 5", "No = 0"],
		},
		{
			id: "head-office-29-computer-with-internet-facility",
			function: "Common",
			category: "Infra",
			parameter: "Computer with Internet Facility",
			criteria: ["Inspect", "Yes = 5", "No = 0"],
		},
		{
			id: "head-office-30-cleanliness-outside-entrance",
			function: "Common",
			category: "Process",
			parameter: "Cleanliness outside entrance",
			criteria: ["Visual appeal", "Yes=5", "No=0"],
		},
	],
	BRANCH_OFFICE: [
		{
			id: "branch-office-01-reception-counter",
			function: "Common",
			category: "Infra",
			parameter: "Reception Counter",
			criteria: [
				"Reception Table & Tata Hitachi Backdrop",
				"As per DIM = 5",
				"With branding (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-02-customer-discussion-room",
			function: "Common",
			category: "Infra",
			parameter: "Customer Discussion Room",
			criteria: [
				"Clearly Demarcated Room",
				"As per DIM = 5",
				"Not as per DIM, but well maintained = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-03-customer-seating-area",
			function: "Common",
			category: "Infra",
			parameter: "Customer Seating Area",
			criteria: [
				"Availability of Sofa",
				"As per DIM = 5",
				"Not as per DIM, but well maintained = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-04-spare-parts-counter",
			function: "Common",
			category: "Infra",
			parameter: "Spare Parts Counter",
			criteria: [
				"Clearly Demarcated with Industrial Chairs\n*For Small BO, Reception counter can be consider as Spare Parts Counter",
				"As per DIM = 5",
				"With branding & chairs (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-05-managers-area",
			function: "Common",
			category: "Infra",
			parameter: "Managers Area",
			criteria: [
				"Clearly Demarcated Area for each function",
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "branch-office-06-workstation-for-sales-service-personnel",
			function: "Common",
			category: "Infra",
			parameter: "Workstation for Sales & Service personnel",
			criteria: [
				"As per employees based at location",
				"50% = 5",
				"30-39% = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-07-toilet",
			function: "Common",
			category: "Infra",
			parameter: "Toilet",
			criteria: [
				"Inspect",
				"Separate = 5",
				"Unisex = 3",
				"Unhygenic (both above cases) = 0",
				"Not available = 0",
			],
		},
		{
			id: "branch-office-08-signage-full-length-of-frontage",
			function: "Common",
			category: "Infra",
			parameter: "Signage (full length of frontage)",
			criteria: ["Inspect Availability", "As Per DIM = 5", "Else = 0"],
		},
		{
			id: "branch-office-09-fa-ade",
			function: "Common",
			category: "Infra",
			parameter: "Façade",
			criteria: [
				"Inspect Availability",
				"ACP façade as per DIM = 5",
				"ACP façade not as per DIM(Deviation) = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-10-pylon-pole-signage-projection-signage-insert-glass",
			function: "Common",
			category: "Infra",
			parameter:
				"Pylon/Pole signage / Projection signage/Insert Glass Door in entrance",
			criteria: [
				"Inspect Availability",
				"Available = 0-5(as per inspection)",
				"Else = 0",
			],
		},
		{
			id: "branch-office-11-brochure-stand",
			function: "Sales",
			category: "Infra",
			parameter: "Brochure Stand",
			criteria: [
				"Available & should be visible & accesible to customers",
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "branch-office-12-brochures-10-each-tmx20-zx33u-ex70-ex130-zx120-ex2",
			function: "Sales",
			category: "Infra",
			parameter:
				"Brochures : 10 each\nTMX20|ZX33U|EX70|EX130|ZX120|EX200|EX210|ZX220|PRIME|TL340H|Daemo|NPK",
			criteria: ["Present in Brochure stand", "Yes = 5", "No = 0"],
		},
		{
			id: "branch-office-13-separate-storage-space-for-failed-parts-handling",
			function: "Service",
			category: "Infra",
			parameter: "Separate Storage Space for Failed Parts Handling",
			criteria: [
				'Physical verification of clearly demarcated space (paint or barricade) with Sticker of "Failed Parts"\n\nMinimum 100 Sqft',
				"Yes = 5",
				"No = 0",
			],
		},
		{
			id: "branch-office-14-4-wheeler-with-working-condition",
			function: "Service",
			category: "Infra",
			parameter: "4 wheeler with working condition.",
			criteria: [
				"Condition and Branding of vehicle as per DIM",
				"Conditon  Branding",
				"Good  Yes = 5",
				"Good  No = 3",
				"Average  Yes = 3",
				"Average  No = 2",
				"Else = 0",
			],
		},
		{
			id: "branch-office-15-spare-parts-store-area-closed-demarcated-open",
			function: "Parts",
			category: "Infra",
			parameter: "Spare parts store area (ClosedDemarcated Open)",
			criteria: [
				"Main Warehouse\nPopulation | Sq.ft\n1-200 : 500\n201-350 : 1000\n350-500 : 1500\n>500 : 2000\n\nBranch : 200sq.ft",
				"As per requirement : 5",
				"25% deviation : 3",
				"Else : 0",
			],
		},
		{
			id: "branch-office-16-steel-racks",
			function: "Parts",
			category: "Infra",
			parameter: "Steel Racks",
			criteria: [
				"Parts segregated in Bins with the same Pigeon Hole",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "branch-office-17-pallets-for-heavy-parts",
			function: "Parts",
			category: "Infra",
			parameter: "Pallets for Heavy Parts",
			criteria: [
				"Heavy Parts (GET's, Pins, Aggregates) should be kept on Pallets (not on ground/floor)",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "branch-office-18-storage-area",
			function: "Parts",
			category: "Infra",
			parameter: "Storage area",
			criteria: [
				"Dust-free, Cobweb-free & Direct Sunlight-free",
				"Yes=5",
				"No=0",
			],
		},
		{
			id: "branch-office-19-branding-of-racks-and-bins-as-per-dim",
			function: "Parts",
			category: "Infra",
			parameter: "Branding of racks and bins as per DIM",
			criteria: [
				"As per DIM & Dust-free & Cobweb free",
				"Yes=5",
				"Not as per DIM, but neatly maintained=3",
				"No=0",
			],
		},
		{
			id: "branch-office-20-branding-and-signage-s-of-parts-counter-as-per-dea",
			function: "Parts",
			category: "Infra",
			parameter:
				"Branding and signage's of Parts counter as per Dealership Identity Manual",
			criteria: [
				"Reception Table & Tata Hitachi Backdrop",
				"As per DIM = 5",
				"With branding (not as per DIM) = 3",
				"Else = 0",
			],
		},
		{
			id: "branch-office-21-storage-location-for-lubes",
			function: "Parts",
			category: "Infra",
			parameter: "Storage location for Lubes",
			criteria: ["Demarcated location", "Yes=5", "No=0"],
		},
		{
			id: "branch-office-22-display-of-organization-chart-with-photograph-role",
			function: "Common",
			category: "Infra",
			parameter:
				"Display of Organization Chart with Photograph, Roles & Responsibilities, Policy Board, Timing Board, Circular Board",
			criteria: [
				"Refer Organisation Structure",
				"Available = 0-5(As per inspection)",
				"No = 0",
			],
		},
		{
			id: "branch-office-23-computer-with-internet-facility",
			function: "Common",
			category: "Infra",
			parameter: "Computer with Internet Facility",
			criteria: ["Inspect", "Yes = 5", "No = 0"],
		},
		{
			id: "branch-office-24-cleanliness-outside-entrance",
			function: "Common",
			category: "Process",
			parameter: "Cleanliness outside entrance",
			criteria: ["Visual appeal", "Yes=5", "No=0"],
		},
		{
			id: "branch-office-25-branch-office-category-commerical-complex-resident",
			function: "Common",
			category: "Process",
			parameter: "Branch Office Category - \n*Commerical Complex\n*Residential",
			criteria: [
				"Visual appeal",
				"Commercial Building = 5",
				"Residential Building = 0",
			],
		},
		{
			id: "branch-office-26-availability-of-uniform-i-card-visiting-card-emplo",
			function: "Common",
			category: "Process",
			parameter: "Availability of Uniform, I-Card, Visiting Card(Employees)",
			criteria: ["Inspect", "Available = 0-5(As per inspection)", "No = 0"],
		},
		{
			id: "branch-office-27-internal-branding-as-per-thcm-dim-guidelines",
			function: "Common",
			category: "Infra",
			parameter: "Internal Branding as per THCM/DIM Guidelines",
			criteria: ["Inspect", "Available = 5", "No = 0"],
		},
		{
			id: "branch-office-28-availability-of-staff-office-boy-for-drinking-wate",
			function: "Common",
			category: "Process",
			parameter:
				"Availability of staff/office boy for Drinking Water and Tea Coffee",
			criteria: ["Visual appeal", "Available = 5", "No = 0"],
		},
		{
			id: "branch-office-29-availability-of-letter-head",
			function: "Common",
			category: "Process",
			parameter: "Availability of Letter head",
			criteria: ["Inspect", "Available = 5", "No = 0"],
		},
		{
			id: "branch-office-30-manpower-availablity-as-per-abp",
			function: "Common",
			category: "Process",
			parameter: "Manpower availablity as per ABP",
			criteria: ["Inspect", "Available = 5", "No = 0"],
		},
	],
} as const satisfies Record<
	ChecklistFacilityType,
	readonly ChecklistTemplateParameter[]
>;

export const CHECKLIST_TEMPLATES: readonly ChecklistTemplate[] = [
	{
		id: "dealer-facility-infrastructure",
		title: "Dealer Facility & Infrastructure",
		description: "Standard assessment for dealer workshops and customer areas.",
		status: "published",
		sectionCount: 8,
		pointCount: 64,
		readiness: 100,
		updatedLabel: "Updated 2 days ago",
		featured: false,
		category: "Facility",
		ownerSearchText: "Riya Shah Amit Kumar RS AK",
		owners: [
			{
				id: "rs",
				firstName: "Riya",
				lastName: "Shah",
				className: "bg-navy",
			},
			{
				id: "ak",
				firstName: "Amit",
				lastName: "Kumar",
				className: "bg-slate",
			},
		],
		parametersByFacility: FACILITY_INFRASTRUCTURE_PARAMETERS,
	},
	{
		id: "service-workshop-operations",
		title: "Service Workshop Operations",
		description: "Tools, bay discipline, PPE and technician process checks.",
		status: "published",
		sectionCount: 6,
		pointCount: 52,
		readiness: 100,
		updatedLabel: "Updated 8 Sep 2026",
		category: "Workshop",
		ownerSearchText: "Priya Mehta PM",
		owners: [
			{
				id: "pm",
				firstName: "Priya",
				lastName: "Mehta",
				className: "bg-purple",
			},
		],
	},
	{
		id: "parts-warehouse-review",
		title: "Parts Warehouse Review",
		description: "Storage, stock accuracy, labelling and material handling.",
		status: "draft",
		sectionCount: 5,
		pointCount: 31,
		readiness: 72,
		updatedLabel: "Updated today",
		category: "Warehouse",
		ownerSearchText: "Pranav Das PD",
		owners: [
			{
				id: "pd",
				firstName: "Pranav",
				lastName: "Das",
				className: "bg-brown",
			},
		],
	},
	{
		id: "customer-experience-showroom",
		title: "Customer Experience & Showroom",
		description: "Brand presentation, enquiry handling and visitor facilities.",
		status: "published",
		sectionCount: 7,
		pointCount: 48,
		readiness: 94,
		updatedLabel: "Updated 5 days ago",
		category: "Customer experience",
		ownerSearchText: "Neha Rao NR",
		owners: [
			{
				id: "nr",
				firstName: "Neha",
				lastName: "Rao",
				className: "bg-teal",
			},
		],
	},
	{
		id: "sales-process-compliance",
		title: "Sales Process Compliance",
		description:
			"Lead handling, documentation and customer follow-up standards.",
		status: "draft",
		sectionCount: 4,
		pointCount: 28,
		readiness: 58,
		updatedLabel: "Updated yesterday",
		category: "Sales",
		ownerSearchText: "Arjun Sen AS",
		owners: [
			{
				id: "as",
				firstName: "Arjun",
				lastName: "Sen",
				className: "bg-blue",
			},
		],
	},
	{
		id: "safety-environment",
		title: "Safety & Environment",
		description: "Workplace safety, waste handling and emergency preparedness.",
		status: "published",
		sectionCount: 9,
		pointCount: 71,
		readiness: 100,
		updatedLabel: "Updated 1 Sep 2026",
		category: "Safety",
		ownerSearchText: "Karan Bose KB",
		owners: [
			{
				id: "kb",
				firstName: "Karan",
				lastName: "Bose",
				className: "bg-green",
			},
		],
	},
] as const;

/**
 * TEMPORARY mock data source for full checklist template detail
 * (sections  parameters), keyed by the same ids used in
 * checklist-library.constants.ts.
 *
 * checklist-library.constants.ts only holds summary card data
 * (counts, readiness %) for the listing grid — it does NOT carry
 * full section/parameter detail, so the edit flow needs this
 * separate lookup until the real GET /checklist-templates/:id
 * endpoint exists.
 *
 * Replace with dealerAuditTemplateApi.getTemplate(id) in Day 8-9.
 */
const MOCK_TEMPLATE_DETAIL: Record<string, ChecklistTemplateDetail> = {
	"dealer-facility-infrastructure": {
		id: "dealer-facility-infrastructure",
		name: "Dealer Facility & Infrastructure",
		description: "Standard assessment for dealer workshops and customer areas.",
		auditCategory: "Dealer audit",
		facilityType: "BRANCH_OFFICE",
		status: "published",
		version: 3,
		updatedAt: "2026-09-14T00:00:00.000Z",
		sections: [
			/* ...unchanged... */
		],
	},
	"service-workshop-operations": {
		id: "service-workshop-operations",
		name: "Service Workshop Operations",
		description: "Tools, bay discipline, PPE and technician process checks.",
		auditCategory: "Dealer audit",
		facilityType: "BRANCH_OFFICE",
		status: "published",
		version: 1,
		updatedAt: "2026-09-08T00:00:00.000Z",
		sections: [
			{
				id: "section-tools",
				order: 0,
				name: "Tools & Equipment",
				parameters: [
					{
						id: "param-tool-calibration",
						order: 0,
						title: "Are calibrated tools within validity?",
						description:
							"Check calibration stickers and due dates on torque wrenches and diagnostic tools.",
						scoreMin: 0,
						scoreMax: 5,
						weight: 1,
						evidenceRequired: true,
						minEvidenceCount: 1,
						maxEvidenceCount: 3,
					},
				],
			},
			{
				id: "section-ppe",
				order: 1,
				name: "PPE Compliance",
				parameters: [
					{
						id: "param-ppe-usage",
						order: 0,
						title: "Are technicians wearing required PPE?",
						description:
							"Gloves, safety glasses and footwear as per workshop safety policy.",
						scoreMin: 0,
						scoreMax: 5,
						weight: 1,
						evidenceRequired: true,
						minEvidenceCount: 1,
						maxEvidenceCount: 3,
					},
				],
			},
		],
	},
	"parts-warehouse-review": {
		id: "parts-warehouse-review",
		name: "Parts Warehouse Review",
		description: "Storage, stock accuracy, labelling and material handling.",
		auditCategory: "Dealer audit",
		facilityType: "BRANCH_OFFICE",
		status: "draft",
		version: 1,
		updatedAt: "2026-09-16T00:00:00.000Z",
		sections: [
			{
				id: "section-storage",
				order: 0,
				name: "Storage & Labelling",
				parameters: [
					{
						id: "param-bin-labels",
						order: 0,
						title: "Are bins clearly labelled with part numbers?",
						description:
							"Verify pigeon-hole labelling matches the inventory system.",
						scoreMin: 0,
						scoreMax: 5,
						weight: 1,
						evidenceRequired: false,
						minEvidenceCount: null,
						maxEvidenceCount: null,
					},
				],
			},
		],
	},
	"customer-experience-showroom": {
		id: "customer-experience-showroom",
		name: "Customer Experience & Showroom",
		description: "Brand presentation, enquiry handling and visitor facilities.",
		auditCategory: "Dealer audit",
		facilityType: "HEAD_OFFICE",
		status: "published",
		version: 2,
		updatedAt: "2026-09-11T00:00:00.000Z",
		sections: [
			{
				id: "section-showroom",
				order: 0,
				name: "Showroom Presentation",
				parameters: [
					{
						id: "param-brochures",
						order: 0,
						title: "Are current model brochures displayed and stocked?",
						description:
							"Check brochure stand for completeness against the current model lineup.",
						scoreMin: 0,
						scoreMax: 5,
						weight: 1,
						evidenceRequired: true,
						minEvidenceCount: 1,
						maxEvidenceCount: 3,
					},
				],
			},
		],
	},
};

export const getMockChecklistTemplateById = (
	id: string,
): ChecklistTemplateDetail | undefined => MOCK_TEMPLATE_DETAIL[id];

export const SCORE_OPTIONS = [
	{
		value: 0,
		label: "Poor",
		// description: "Not compliant.",
	},
	{
		value: 1,
		label: "Needs Improvement",
		// description: "Major improvement is required.",
	},
	{
		value: 2,
		label: "Average",
		// description: "Partially compliant with significant gaps.",
	},
	{
		value: 3,
		label: "Good",
		// description: "Generally compliant with some gaps.",
	},
	{
		value: 4,
		label: "Very Good",
		// description: "Mostly compliant with minor gaps.",
	},
	{
		value: 5,
		label: "Excellent",
		// description: "Fully compliant with the criteria.",
	},
] as const;
