import { format, isValid, parseISO, startOfWeek, subDays } from "date-fns";
import type { IsoDateString } from "../tasks/types";

export function toIsoDateLocal(date: Date): IsoDateString {
  return format(date, "yyyy-MM-dd") as IsoDateString;
}

export function parseIsoDateLocal(iso: IsoDateString): Date {
  // parseISO treats date-only strings as UTC; for local-day semantics we still only
  // use the formatted day boundaries, so this is acceptable for comparisons by yyyy-MM-dd.
  return parseISO(iso);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return toIsoDateLocal(a) === toIsoDateLocal(b);
}

export function localYesterdayIso(today: Date): IsoDateString {
  return toIsoDateLocal(subDays(today, 1));
}

export function weekStartIso(date: Date): IsoDateString {
  return toIsoDateLocal(startOfWeek(date, { weekStartsOn: 1 }));
}

export function safeIsoDate(input: string | null | undefined): IsoDateString | null {
  if (!input) return null;
  const parsed = parseISO(input);
  if (!isValid(parsed)) return null;
  return toIsoDateLocal(parsed);
}
