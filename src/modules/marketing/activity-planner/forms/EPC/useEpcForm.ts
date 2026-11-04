import React from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../../../context/Auth/AuthContext";

import { clearStoredEpcInfo, getStoredEpcInfo } from "../../utils/localstorage";

import { validateEpcForm, type EpcFormErrors } from "./epc.schema";
import { buildEpcCreatePayload, buildEpcUpdatePayload } from "./epc.payload";
import { mapEpcDetailToFormValues } from "./epc.mapper";
import { buildEpcNoFromValues } from "./epcNumber";

import type {
	EpcCreatePayload,
	EpcDetailResponse,
	EpcFormValues,
} from "../../types/epc.types";
import {
	useCreateEpcMutation,
	useUpdateEpcMutation,
} from "../../queries/epc.queries";
import { useAuth } from "../../../../../context/Auth/useAuth"; // adjust if useAuth lives elsewhere
import { findOption, getOptionCode } from "./epc.utils";
import { getZoneCodeForBranch } from "./epc.zonemap";

export type EpcFormMode = "create" | "edit";
export type EpcSaveStatus = "DRAFT" | "SUBMITTED";

/** Fields that were filled from the logged-in user's profile (shown read-only). */
export type ProfileLocked = Partial<
	Record<"region" | "branch" | "department", boolean>
>;

type MasterOption = {
	value: string;
	label: string;
	code?: string;
	[key: string]: unknown;
};

type EpcMasters = {
	regions?: MasterOption[];
	branches?: MasterOption[];
	departments?: MasterOption[];
	vertical?: MasterOption[];
	eventNames?: MasterOption[];
	budgetMasters?: MasterOption[];
};

/**
 * Zone (region option `value`) a branch belongs to. Same rule as
 * EpcFormFields: a region id supplied by the API wins, otherwise the
 * code-based map in epc.zonemap.ts. Null when the branch isn't mapped.
 */
const resolveBranchRegionId = (
	branch: MasterOption,
	regions: MasterOption[] = [],
): string | null => {
	const direct =
		branch.regionId ??
		branch.region_id ??
		branch.zoneId ??
		branch.zone_id ??
		(typeof branch.region === "string" ? branch.region : undefined);

	if (direct) return findOption(regions, String(direct))?.value ?? null;

	const zoneCode = getZoneCodeForBranch(getOptionCode(branch));
	if (!zoneCode) return null;

	return regions.find((r) => getOptionCode(r) === zoneCode)?.value ?? null;
};

export type UseEpcFormProps = {
	mode?: EpcFormMode;
	epcId?: string | null;
	initialData?: EpcDetailResponse | null;
	masters?: EpcMasters;
	onSuccess?: (data?: any) => Promise<void> | void;
};

type UseEpcFormResult = {
	values: EpcFormValues;
	errors: EpcFormErrors;
	loading: boolean;
	isEditMode: boolean;
	profileLocked: ProfileLocked;
	handleChange: (name: keyof EpcFormValues, value: string) => void;
	handleSave: (status: EpcSaveStatus) => Promise<void>;
	handleReset: () => void;
};

export const initialEpcValues: EpcFormValues = {
	epfNo: "",
	poDocumentRefNo: "",

	department: "",
	region: "",
	branch: "",
	budget_master_id: "",
	budgetDescription: "",
	vertical: "",

	event_scale: 0,
	event_name: "",
	event_description: "",
	event_from_date: "",
	event_to_date: "",
	location: "",
	locationMeta: {
		pincode: "",
		officeName: "",
		district: "",
		stateName: "",
		latitude: null,
		longitude: null,
	},
	event_objective: "",

	status: "DRAFT",
	proposal_number: "",
};

const toEpcFormValues = (data?: EpcDetailResponse | null): EpcFormValues => ({
	...initialEpcValues,
	...mapEpcDetailToFormValues(data),
});

const shouldRegenerateEpcNo = (
	mode: EpcFormMode,
	name: keyof EpcFormValues,
) => {
	if (mode === "edit") return false;

	return (
		name === "department" ||
		name === "region" ||
		name === "branch" ||
		name === "vertical"
	);
};
const LOCKED_EDIT_FIELDS: readonly (keyof EpcFormValues)[] = [
	"department",
	"region",
	"branch",
	"vertical",
];
export function useEpcForm({
	mode = "create",
	epcId: propEpcId,
	initialData,
	masters,
	onSuccess,
}: UseEpcFormProps = {}): UseEpcFormResult {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { user } = useAuth();
	const prefilledRef = React.useRef(false);

	const createEpcMutation = useCreateEpcMutation();
	const updateEpcMutation = useUpdateEpcMutation();

	const storedInfo = React.useMemo(() => getStoredEpcInfo(), []);

	const epcId =
		mode === "edit"
			? (propEpcId ?? storedInfo?.epcId ?? null)
			: (propEpcId ?? null);

	const isEditMode = mode === "edit" || Boolean(epcId);

	const initialValues = React.useMemo(() => {
		if (initialData) {
			return toEpcFormValues(initialData);
		}

		return initialEpcValues;
	}, [initialData]);

	const [values, setValues] = React.useState<EpcFormValues>(initialValues);
	const [errors, setErrors] = React.useState<EpcFormErrors>({});

	const loading = createEpcMutation.isPending || updateEpcMutation.isPending;

	const [profileLocked, setProfileLocked] = React.useState<ProfileLocked>({});

	// Create mode only: fill Department, Zone and Branch from the logged-in
	// user, once. A field that was filled this way is locked (read-only); a
	// field the profile couldn't supply stays editable.
	React.useEffect(() => {
		if (mode !== "create" || isEditMode || prefilledRef.current) return;

		// "Loaded" means non-empty, not merely defined: while the masters query
		// is in flight the lists can be [] (truthy), and the profile can be a
		// partial object. Marking the prefill as done on that first pass is why
		// the fields stayed empty until a refresh.
		const regions = masters?.regions;
		const branches = masters?.branches;
		const departments = masters?.departments;

		const mastersReady = Boolean(
			regions?.length && branches?.length && departments?.length,
		);
		const profileReady = Boolean(
			user && (user.department || user.branch || user.zone),
		);

		if (!mastersReady || !profileReady || !regions || !branches || !departments)
			return;

		prefilledRef.current = true; // real data is in: run once, even if nothing matches

		const department = findOption(departments, user!.department);
		const branch = findOption(branches, user!.branch);
		const userZone = findOption(regions, user!.zone);

		// A branch decides its zone (the form keeps the two consistent);
		// otherwise fall back to the user's own zone.
		const branchZoneId = branch ? resolveBranchRegionId(branch, regions) : null;
		const zoneId = branchZoneId ?? userZone?.value ?? "";

		setProfileLocked({
			department: Boolean(department),
			region: Boolean(zoneId),
			branch: Boolean(branch),
		});

		if (!department && !branch && !zoneId) return;

		setValues((prev) => {
			const next: EpcFormValues = { ...prev };
			if (!prev.department && department) next.department = department.value;
			if (!prev.region && zoneId) next.region = zoneId;
			if (!prev.branch && branch) next.branch = branch.value;

			if (
				next.department !== prev.department ||
				next.region !== prev.region ||
				next.branch !== prev.branch
			) {
				const epcNo = buildEpcNoFromValues(next, masters);
				next.epfNo = epcNo;
				next.proposal_number = epcNo;
			}
			return next;
		});
	}, [mode, isEditMode, user, masters]);

	const handleChange = React.useCallback(
		(name: keyof EpcFormValues, value: string) => {
			if (isEditMode && LOCKED_EDIT_FIELDS.includes(name)) {
				return;
			}

			setValues((prev) => {
				const nextValues: EpcFormValues = {
					...prev,
					[name]: value,
				};

				if (shouldRegenerateEpcNo(mode, name)) {
					const generatedEpcNo = buildEpcNoFromValues(nextValues, masters);

					nextValues.epfNo = generatedEpcNo;
					nextValues.proposal_number = generatedEpcNo;
				}

				return nextValues;
			});

			setErrors((prev) => {
				if (!prev[name]) return prev;

				return {
					...prev,
					[name]: undefined,
				};
			});
		},
		[isEditMode, mode, masters],
	);

	const handleReset = React.useCallback(() => {
		setValues(initialValues);
		setErrors({});
	}, [initialValues]);

	const handleSave = React.useCallback(
		async (status: EpcSaveStatus) => {
			try {
				const generatedEpcNo =
					values.proposal_number ||
					values.epfNo ||
					buildEpcNoFromValues(values, masters);

				const nextValues: EpcFormValues = {
					...values,
					status,
					proposal_number: generatedEpcNo,
					epfNo: generatedEpcNo,
				};

				const validationErrors = validateEpcForm(nextValues);

				if (Object.keys(validationErrors).length > 0) {
					setErrors(validationErrors);

					showToast({
						type: "error",
						title: "Validation Error",
						description: "Please fill all required EPC fields.",
					});

					return;
				}

				if (!nextValues.proposal_number) {
					showToast({
						type: "error",
						title: "EPC No missing",
						description:
							"Please select Department, Zone, Branch, and Vertical to generate EPC No.",
					});

					return;
				}

				let savedData: any;

				if (isEditMode && epcId) {
					const payload = buildEpcUpdatePayload(nextValues);

					savedData = await updateEpcMutation.mutateAsync({
						epcId,
						payload,
					});

					showToast({
						type: "success",
						title: "Success",
						description: "EPC updated successfully.",
					});
				} else {
					const payload: EpcCreatePayload = buildEpcCreatePayload(nextValues);

					savedData = await createEpcMutation.mutateAsync(payload);

					clearStoredEpcInfo();

					showToast({
						type: "success",
						title: "Success",
						description: "EPC created successfully.",
					});
				}

				if (onSuccess) {
					await onSuccess(savedData);
					return;
				}

				const savedEpcId =
					savedData?.id ??
					savedData?.eventProposal?.id ??
					savedData?.epcId ??
					savedData?.epc?.id ??
					epcId;

				if (savedEpcId) {
					navigate(`/marketing/activity-planner/${savedEpcId}`);
				} else {
					navigate("/marketing/activity-planner/listing");
				}
			} catch (error: any) {
				console.error("EPC save failed:", error);

				showToast({
					type: "error",
					title: "Error",
					description:
						error?.response?.data?.message ||
						error?.message ||
						"Failed to save EPC.",
				});
			}
		},
		[
			values,
			masters,
			isEditMode,
			epcId,
			updateEpcMutation,
			createEpcMutation,
			showToast,
			onSuccess,
			navigate,
		],
	);

	return {
		values,
		errors,
		loading,
		isEditMode,
		profileLocked,
		handleChange,
		handleSave,
		handleReset,
	};
}
