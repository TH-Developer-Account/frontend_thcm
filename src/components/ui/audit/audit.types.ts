export type AuditUser = {
	id: string;
	first_name: string;
	last_name: string;
	email?: string;
};

export type AuditLogEntry = {
	id: string;
	action: string;
	metadata?: Record<string, unknown> | null;
	actor: AuditUser | null;
	stageName?: string;
	createdAt: string;
};

export type AuditApiAdapter = {
	getAuditLog: (params: {
		subjectType: string;
		subjectId: string;
	}) => Promise<AuditLogEntry[]>;
};
