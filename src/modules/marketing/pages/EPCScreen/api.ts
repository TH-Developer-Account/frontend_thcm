export const fetchDropdownOptions = async () => {
  const res = await fetch("/api/epc/options");
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
};

export const fetchBranchesByZone = async (regionId: string) => {
  const res = await fetch(`/api/epc/branches?region=${regionId}`);
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
};

export const generateEpfNumber = async () => {
  const res = await fetch("/api/epc/generate-number");
  if (!res.ok) throw new Error("Failed to generate EPF number");
  return res.json();
};

export const fetchEpcById = async (id: string) => {
  const res = await fetch(`/api/epc/${id}`);
  if (!res.ok) throw new Error("Failed to fetch EPC");
  return res.json();
};
