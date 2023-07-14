export type RemoteData<T> = NotStarted | InProgress<T> | Failed | Succeeded<T>;

export type NotStarted = { tag: "notStarted" };
export type InProgress<T> = { tag: "inProgress"; placeholder?: T };
export type Failed = { tag: "failed"; message: string };
export type Succeeded<T> = { tag: "succeeded"; data: T };

const notStarted = { tag: "notStarted" } as const;
const inProgress = <T>(placeholder?: T) =>
  ({ tag: "inProgress", placeholder } as const);
const failed = (message: string): Failed => ({ tag: "failed", message });
const succeeded = <T>(data: T): Succeeded<T> => ({ tag: "succeeded", data });
const mapCache = <T>(data: T | null, placeholder?: T): RemoteData<T> =>
  data === null ? inProgress(placeholder) : succeeded(data);

export const RemoteData = {
  notStarted,
  inProgress,
  failed,
  succeeded,
  mapCache,
};
