import { STATUS, TopupStatus, statusToViText, normalizeStatus } from "@/src/core/constants";

export const getStatusText = (status: string): string => {
  const s = normalizeStatus(status);
  return statusToViText(s);
};

export const getStatusBadge = (status: string): string => {
  const s = normalizeStatus(status);
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  switch (s) {
    case STATUS.PENDING:
      return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-300/20 dark:text-yellow-300`;
    case STATUS.APPROVED:
      return `${base} bg-green-100 text-green-800 dark:bg-green-300/20 dark:text-green-300`;
    case STATUS.REJECTED:
      return `${base} bg-red-100 text-red-800 dark:bg-red-300/20 dark:text-red-300`;
    case STATUS.CANCELLED:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-300/20 dark:text-gray-300`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-300/20 dark:text-gray-300`;
  }
};

export const isStatusPending = (status: string): boolean => {
  const s = normalizeStatus(status);
  return s === STATUS.PENDING;
};

export type { TopupStatus };
export { STATUS };

