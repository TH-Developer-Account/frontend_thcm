import type { Option } from "../../../../components/FormElements/input.types";
import type {
	Approver,
	CurrentAuthUser,
	WorkflowBasics,
	WorkflowSettings,
	WorkflowStage,
} from "../types/workflow.types";

export const regionOptions = [
	{ label: "South Asia — India", value: "region-uuid-1" },
	{ label: "South-East Asia", value: "region-uuid-2" },
	{ label: "EMEA", value: "region-uuid-3" },
	{ label: "Americas", value: "region-uuid-4" },
	{ label: "Global", value: "region-uuid-5" },
];

export const availableUsers: Approver[] = [
	{
		id: "user-uuid-2",
		name: "Sunita Rao",
		email: "sunita.rao@example.com",
		role: "Recommender",
		initials: "SR",
		avatarVariant: "teal",
	},
	{
		id: "user-uuid-3",
		name: "Kiran Patel",
		email: "kiran.patel@example.com",
		role: "Checker",
		initials: "KP",
		avatarVariant: "purple",
	},
	{
		id: "user-uuid-4",
		name: "Rohit Shah",
		email: "rohit.shah@example.com",
		role: "Approver",
		initials: "RS",
		avatarVariant: "orange",
	},
	{
		id: "user-uuid-5",
		name: "Amit Kumar",
		email: "amit.kumar@example.com",
		role: "Validator",
		initials: "AK",
		avatarVariant: "blue",
	},
	{
		id: "user-uuid-6",
		name: "Priya Nair",
		email: "priya.nair@example.com",
		role: "Finance Controller",
		initials: "PN",
		avatarVariant: "teal",
	},
];

export const appOptionsS: Option[] = [
	{
		label: "Marketing Activity Planner",
		value: "Marketing Activity Planner",
	},
	{
		label: "Customer Master Data",
		value: "Customer Master Data",
	},
	{
		label: "Dealer Claims",
		value: "Dealer Claims",
	},
];
export const initialBasics: WorkflowBasics = {
	name: "Standard EPC Approval",
	regionId: "region-uuid-1",
	minBudget: "0",
	maxBudget: "1000000",
	priority: "1",
	isActive: true,
	description: "Standard approval flow for EPC workflow submissions.",
};

export const initialSettings: WorkflowSettings = {
	allowSubmitterEdit: false,
	emailNotifications: true,
	remindOnSlaBreach: true,
	requireCommentOnReject: false,
	autoApproveOnTimeout: false,
};

export const getCurrentUserApprover = (user: CurrentAuthUser): Approver => ({
	id: user.id,
	name: `${user.first_name} ${user.last_name}`,
	email: user.email,
	role: "Proposer",
	initials: `${user.first_name[0]}${user.last_name[0]}`,
	avatarVariant: "orange",
});

export const createInitialStages = (currentUser: Approver): WorkflowStage[] => [
	{
		id: "stage-1",
		stageOrder: 1,
		name: "Proposer",
		strategy: "ANY",
		slaDays: "1",
		rejectionAction: "RETURN",
		isExpanded: true,
		approvers: [currentUser],
	},
	{
		id: "stage-2",
		stageOrder: 2,
		name: "Recommender",
		strategy: "ANY",
		slaDays: "2",
		rejectionAction: "RETURN",
		isExpanded: false,
		approvers: [],
	},
	{
		id: "stage-3",
		stageOrder: 3,
		name: "Checker",
		strategy: "ANY",
		slaDays: "2",
		rejectionAction: "RETURN",
		isExpanded: false,
		approvers: [],
	},
	{
		id: "stage-4",
		stageOrder: 4,
		name: "Approver",
		strategy: "ALL",
		slaDays: "2",
		rejectionAction: "RETURN",
		isExpanded: false,
		approvers: [],
	},
	{
		id: "stage-5",
		stageOrder: 5,
		name: "Validator",
		strategy: "ANY",
		slaDays: "1",
		rejectionAction: "RETURN",
		isExpanded: false,
		approvers: [],
	},
];

export const api_routes = {
	// other routes...
	create_workflow_api_route: "/work-flow",
	get_all_workflow_api_route: "/work-flow",
	create_assign_users_workflow_template: "work-flow/assign-profile",
};
