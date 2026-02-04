type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean>
  | ClassValue[];

const toClass = (value: ClassValue): string => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toClass).filter(Boolean).join(" ");
  return Object.entries(value)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .join(" ");
};

export const cn = (...values: ClassValue[]) =>
  values.map(toClass).filter(Boolean).join(" ");
