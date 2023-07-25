import { Cmd } from "./Cmd";

export function initHttp() {
  const cache = new Map<string, Response>();

  function get<T, Msg>(
    url: string,
    andThen: (data: T) => Msg
  ): [Cmd<Msg>, T | null] {
    // check if we've cached this request before
    const cachedData = cache.get(url) ?? null;

    const fetchCmd = Cmd.ofPromise(
      () =>
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            cache.set(url, data);
            return data;
          }),
      andThen
    );

    return [fetchCmd, (cachedData as T) ?? null];
  }

  const Http = {
    get,
  };

  return {
    Http,
  };
}
