import match, { Tagged, tagged } from "../utilities/matcher";

export type Option<T> = Tagged<"some", { data: T }> | Tagged<"none">;

const map = <A>(opt: Option<A>) => ({
  to: <B>(f: (a: A) => B): Option<B> =>
    match.tagged(opt).on<Option<B>>({
      none: (n) => n,
      some: ({ data }) => some(f(data)),
    }),
});

const flatMap = <A>(opt: Option<A>) => ({
  to: <B>(f: (a: A) => Option<B>) =>
    match.tagged(opt).on<Option<B>>({
      none: (n) => n,
      some: ({ data }) => f(data),
    }),
});

const some = <T>(data: T) => tagged("some")({ data });
const none = { tag: "none" };

const withDefault =
  <A>(opt: Option<A>) =>
  (deflt: A): A =>
    match.tagged(opt).on({
      none: () => deflt,
      some: ({ data }) => data,
    });

export const Option = {
  map,
  flatMap,
  some,
  none,
  withDefault,
};
