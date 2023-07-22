import { pipe } from "fp-ts/lib/function";
import { Parser, SeqOf } from "./Parser";

const {
  ok,
  fail,
  exact,
  seq,
  both: andThen,
  anyOf,
  oneOf,
  apply,
  either,
  lift2,
  many0,
  map,
  unit: ret,
  parse: run,
} = Parser;

export const splitToParts = (s: string) =>
  pipe(
    s.split("/").filter((s) => !!s.length),
    (parts) => {
      const last = parts.pop();
      return last ? [...parts, ...last.split("?")] : parts;
    }
  );

const erasable = (parser: Parser<unknown>): Parser<typeof erase> =>
  map(parser)(() => erase);

const s = <S extends string>(s: S) => pipe(s, Parser.s, exact, erasable);

const alpha = exact(Parser.alpha);
const word = exact(Parser.word);
const int = exact(Parser.int);
const digit = exact(Parser.digit);
const digitN = exact(Parser.digitN);
const alphaNumericString = exact(Parser.alphaNumericString);
const top = map(exact(Parser.s("/")))(() => undefined as void);

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

const path = <P extends Parser<unknown>[]>(
  ...parsers: P
): Parser<Parts<P>> => ({
  fn: (str) => {
    const pathParts = splitToParts(str);

    if (pathParts.length !== parsers.length)
      return fail("length of path parts did not match the number of parsers");

    const seqParsed = [];
    let toParse = str;

    for (let i = 0; i < pathParts.length; i++) {
      const [pathPart, parser] = [pathParts[i], parsers[i]];
      const result = parser.fn(pathPart);

      if (result.tag === "fail") return result;
      const { parsed, rest } = result;

      // when accumulating path parts, the results from the "UrlParser.s" function
      // are not included in the resulting tuple returned from this function.
      if (parsed === erase) continue;

      seqParsed.push(parsed);
      toParse = rest;
    }

    const [head, ...tail] = seqParsed;

    const parsed = tail.length === 0 ? head : seqParsed;

    return ok(parsed as Parts<P>, toParse);
  },
});

type ParamType = "int" | "str" | "int?" | "str?";

type SearchParams<Q extends Record<string, ParamType>> = {
  [Key in RequiredKeys<Q>]: Q[Key] extends "int"
    ? number
    : Q[Key] extends "str"
    ? string
    : never;
} & {
  [Key in OptionalKeys<Q>]?: Q[Key] extends "int?"
    ? number
    : Q[Key] extends "str?"
    ? string
    : never;
};

type RequiredKeys<T extends Record<string, unknown>> = {
  [Key in keyof T]: T[Key] extends "int" | "str" ? Key : never;
}[keyof T];

type OptionalKeys<T extends Record<string, unknown>> = {
  [Key in keyof T]: T[Key] extends "int?" | "str?" ? Key : never;
}[keyof T];

/**
 * @example
 * // creates a path parser with search params
 *   ([id, params]) => ({ id, params }),
 *   path(
 *     s("pokemon"),
 *     int,
 *     search({
 *       offset: "int",
 *       limit: "int?",
 *     })
 *   )
 *
 * // /pokemon/13?offset=20             ==>  ok:    [ 13, { offset: 20 } ]
 * // /pokemon/13?offset=20&limit=10    ==>  ok:    [ 13, { offset: 20, limit: 10 } ]
 * // /pokemon                          ==>  fail   (missing int)
 * // /pokemon/13                       ==>  fail   (missing offset param)
 * // /pokemon/13?limit=10              ==>  fail   (missing offset param)
 */
const search = <Q extends Record<string, ParamType>>(
  params: Q
): Parser<SearchParams<Q>> => ({
  fn: (str) => {
    // 1. parse the "?"
    // 2. get all the kvps from the url
    //    a. split on "&"
    //    b. map to {K : V}
    // 3. for each param in params: Q, attempt to find it in the kvps
    // 4. if not found for a required param, the parser fails

    if (str.length === 0) return fail("there was no query string");

    const paramsParser: Parser<SearchParams<Q>> = {
      fn: (str) => {
        const paramsRaw = str.split("&");

        const kvps = [] as { key: keyof Q; value: string }[];

        for (const rawParam of paramsRaw) {
          const parser = map(
            exact(seq(Parser.word, Parser.s("="), Parser.alphaNumericString))
          )(([k, , v]) => ({ key: k, value: v }));

          const result = parser.fn(rawParam);

          if (result.tag === "fail") {
            return fail(`Error parsing query param: ${rawParam}.
            Inner Error: ${result.error}`);
          }

          kvps.push(result.parsed);
        }

        const retVal = {} as any;

        for (const p in params) {
          const param = p as keyof Q;
          const paramType = params[param] as ParamType;

          const requiredParam = paramType === "int" || paramType === "str";
          const intParam = paramType === "int" || paramType === "int?";

          const kvp = kvps.find((kvp) => kvp.key === param) ?? null;

          const missingRequired = `Could not find required queryParam "${param.toString()}" of configured type "${paramType}"`;

          // optional params
          if (!requiredParam) {
            if (kvp === null) continue;

            // optional int
            if (intParam) {
              const intValue = Number.parseInt(kvp.value);
              if (isNaN(intValue)) {
                return fail(
                  `Query Parameter ${param.toString()} was configured as "${paramType}, but failed when parsing value "${
                    kvp.value
                  }" as an integer."`
                );
              }

              retVal[param] = intValue;
              continue;
            }

            // optional string
            retVal[param] = kvp.value;
            continue;
          }

          // required params
          if (kvp === null) {
            return fail(missingRequired);
          }

          // required int
          if (intParam) {
            const intValue = Number.parseInt(kvp.value);
            if (isNaN(intValue)) {
              return fail(
                `Query Parameter ${param.toString()} was configured as "${paramType}, but failed when parsing value "${
                  kvp.value
                }" as an integer."`
              );
            }

            retVal[param] = intValue;
            continue;
          }

          // required string
          retVal[param] = kvp.value;
        }

        return ok(retVal as SearchParams<Q>, "");
      },
    };

    return paramsParser.fn(str);
  },
});

export const UrlParser = {
  top,
  alpha,
  word,
  alphaNumericString,
  digit,
  digitN,
  int,
  s,
  search,
  path,
  seq,
  andThen,
  apply,
  many0,
  anyOf,
  either,
  lift2,
  oneOf,
  map,
  ret,
  run,
};

export const erase = Symbol();
