import { ServerAxios } from "../../../../services/ServerAxios";

export const uploadQuotationFile = async (file: File) => {
	const formData = new FormData();

	formData.append("file", file);
	console.log("UPLOADING FILE", file);
	// const response = await ServerAxios.post("/api/upload", formData, {
	// 	headers: {
	// 		"Content-Type": "multipart/form-data",
	// 	},
	// });

	return file;
};
