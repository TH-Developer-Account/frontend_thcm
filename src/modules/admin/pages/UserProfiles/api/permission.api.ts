import axios from "axios";

export const saveWorkspaceProfile = async (payload: any) => {
	const res = await axios.post("/api/workspace/profile", payload);
	return res.data;
};
