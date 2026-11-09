export function isUniqueConstraint(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, cause } = error as { code?: string; cause?: unknown };
  return (
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    (!!cause && cause !== error && isUniqueConstraint(cause))
  );
}
