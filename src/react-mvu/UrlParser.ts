import { pipe } from "fp-ts/lib/function";
import { Parser, SeqOf } from "./Parser";
import match from "../utilities/matcher";

const {
  word,
  s,
  int,
  alphaNumericString,
  ok,
  fail,
  parse,
  map,
  bind,
  unit,
  apply,
  lift2,
  both,
  left,
  right,
  between,
  peek,
  sepBy1,
  sepBy0,
  many0,
  many1,
  either,
  seq,
  opt,
  exact,
  oneOf,
  erase,
  erasable,
  anyOf,
} = Parser;

const slash = s("/");

const top = right(opt(slash))(s(""));

const pathPart = <A>(parser: Parser<A>) => right(slash)(parser);

type ExcludeFromTuple<T extends readonly unknown[], Exclude> = T extends [
  infer Head,
  ...infer Tail
]
  ? [Head] extends [Exclude]
    ? ExcludeFromTuple<Tail, Exclude>
    : [Head, ...ExcludeFromTuple<Tail, Exclude>]
  : [];

type Parts<P extends Parser<unknown>[]> = SeqOf<P> extends infer U
  ? U extends readonly unknown[]
    ? ExcludeFromTuple<U, typeof erase> extends [infer Head, ...infer Tail]
      ? Tail extends []
        ? Head
        : ExcludeFromTuple<U, typeof erase>
      : never
    : never
  : never;

const path = <P extends Parser<unknown>[]>(...parsers: P): Parser<Parts<P>> => {
  if (parsers.length === 0) throw "path cannot take less than 1 parsers.";

  const finalParserRaw = parsers[parsers.length - 1];
  const finalParserTransformed = left(finalParserRaw)(top);

  const transformed =
    parsers.length === 1
      ? [finalParserTransformed]
      : [...parsers.slice(0, parsers.length - 1), finalParserTransformed];

  return exact(
    map(seq(...transformed))((partsRaw) => {
      const parts = partsRaw.filter((p) => p !== erase);
      if (parts.length === 0) return undefined as Parts<P>;

      const [head, ...tail] = parts;
      return tail.length === 0 ? (head as Parts<P>) : (parts as Parts<P>);
    })
  );
};

type QueryParam<Key extends string, Value = string> = {
  [K in Key]: Value;
};

/**
 * Matches a single search param, e.g. `key=value`. Parses the value
 * as a string.
 */
const strParam = <Key extends string>(key: Key) =>
  map(both(s(key))(right(s("="))(alphaNumericString)))(
    ([key, val]) => ({ [key]: val } as { [K in Key]: string })
  );

/**
 * Matches a single search param, e.g. `key=value`. Parses the value
 * as an integer.
 */
const intParam = <Key extends string>(
  key: Key
): Parser<{ [K in Key]: number }> => ({
  fn: (str) =>
    match.tagged(strParam(key).fn(str)).on({
      fail: (f) => f,
      ok: ({ parsed, rest }) =>
        pipe(parseInt(parsed[key]), (asInt) =>
          isNaN(asInt)
            ? fail(`Could not parse ${asInt} into an integer.`)
            : ok({ [key]: asInt } as { [K in Key]: number }, rest)
        ),
    }),
});

type ParamsReturn<P extends Parser<QueryParam<string, unknown>>[]> =
  P extends []
    ? NonNullable<unknown>
    : P extends [infer Head, ...infer Tail]
    ? Head extends Parser<QueryParam<infer Key, infer Value>>
      ? Tail extends Parser<QueryParam<string, unknown>>[]
        ? { [K in Key]: Value } & ParamsReturn<Tail>
        : NonNullable<unknown>
      : NonNullable<unknown>
    : NonNullable<unknown>;

const params = <P extends Parser<QueryParam<string, unknown>>[]>(
  ...paramParsers: P
): Parser<ParamsReturn<P>> => {
  const param = oneOf(...paramParsers);
  const zeroOrMoreParams = sepBy0(s("&"))(param);
  return map(zeroOrMoreParams)((kvps) =>
    kvps.reduce(
      (acc, curr) => (typeof curr === "object" ? { ...acc, ...curr } : acc),
      {} as ParamsReturn<P>
    )
  );
};

const search = <P extends Parser<QueryParam<string, unknown>>[]>(
  ...paramParsers: P
) => right(s("?"))(params(...paramParsers));

export const UrlParser = {
  search,
  intParam,
  strParam,
  path,
  top,
  int: pathPart(int),
  word: pathPart(word),
  alphaNumericString: pathPart(alphaNumericString),
  s: <S extends string>(str: S) => pipe(str, s, erasable, pathPart),
  pathPart,
  params,
  parse,
  map,
  bind,
  unit,
  apply,
  lift2,
  both,
  left,
  right,
  between,
  peek,
  sepBy1,
  sepBy0,
  many0,
  many1,
  either,
  seq,
  opt,
  exact,
  oneOf,
  erase,
  erasable,
  anyOf,
};
