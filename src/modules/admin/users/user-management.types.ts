import type { TableUser } from "../../../utils/types";

export type UserStatusTab = "All" | TableUser["status"];

export type UserRoleOption = {
	label: string;
	value: string;
};

export type UserCounts = Record<UserStatusTab, number>;

/**
 * Optional API entry point. Keep API mapping inside the service that provides
 * this function so the UI always receives the canonical TableUser shape.
 */
export type FetchUsers = (signal: AbortSignal) => Promise<TableUser[]>;

export type UserRowActionHandler = (user: TableUser) => void;
