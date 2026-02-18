export function combineDateTime(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr || !timeStr) return null;
  try {
    const dateTimeStr = `${dateStr.slice(0, 10)}T${timeStr}`;
    return new Date(dateTimeStr);
  } catch {
    return null;
  }
}