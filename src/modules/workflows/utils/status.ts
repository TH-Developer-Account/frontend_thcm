export const normalizeWorkflowStatus = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();
