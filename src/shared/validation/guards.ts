// Hand-written structural guards used to validate data read back from local storage
// (spec 010, ADR-0003): no schema library, only what restoring a session needs.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export const isNonNegativeNumber = (value: unknown): value is number => isFiniteNumber(value) && value >= 0;

export const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const isNullableString = (value: unknown): value is string | null => value === null || isString(value);

export const isOneOf = <T extends string | number>(values: readonly T[]) =>
  (value: unknown): value is T => values.includes(value as T);

export const isArrayOf = <T>(value: unknown, guard: (item: unknown) => item is T): value is T[] =>
  Array.isArray(value) && value.every((item) => guard(item));

export const isRecordOf = <T>(value: unknown, guard: (item: unknown) => item is T): value is Record<string, T> =>
  isRecord(value) && Object.values(value).every((item) => guard(item));

export const isIndexWithin = (index: unknown, length: number): index is number =>
  isNonNegativeInteger(index) && index < length;
