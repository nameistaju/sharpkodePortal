export const unwrap = (response) => response.data?.data ?? response.data;

export const unwrapItems = (response) => unwrap(response)?.items ?? [];

export const getErrorMessage = (error) =>
    error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";

export const employeeName = (employee) => employee?.name || "Unknown employee";

export const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";

export const formatDateTime = (value) => value ? new Date(value).toLocaleString() : "-";
