export type StoredEpcInfo = {
	epcId?: string | null;
	crfId?: string | null;
	epfId?: string | null;
};

export const getStoredEpcInfo = (): StoredEpcInfo | null => {
	const stored = localStorage.getItem("epcInfo");

	if (!stored) return null;

	try {
		return JSON.parse(stored) as StoredEpcInfo;
	} catch {
		return null;
	}
};

export const clearStoredEpcInfo = () => {
	localStorage.removeItem("epcInfo");
};

export const getStoredAppId = () => {
	return localStorage.getItem("appId");
};
