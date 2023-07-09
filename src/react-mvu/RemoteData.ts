export type RemoteData<T> = NotStarted | InProgress | Failed | Succeeded<T>;

export type NotStarted = { tag: "notStarted" };
export type InProgress = { tag: "inProgress" };
export type Failed = { tag: "failed"; message: string };
export type Succeeded<T> = { tag: "succeeded"; data: T };

const notStarted = { tag: "notStarted" } as const;
const inProgress = { tag: "inProgress" } as const;
const failed = (message: string): Failed => ({ tag: "failed", message });
const succeeded = <T>(data: T): Succeeded<T> => ({ tag: "succeeded", data });
const mapCache = <T>(data: T | null): RemoteData<T> =>
  data === null ? inProgress : succeeded(data);

export const RemoteData = {
  notStarted,
  inProgress,
  failed,
  succeeded,
  mapCache,
};
