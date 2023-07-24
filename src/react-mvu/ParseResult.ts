import match, { Tagged } from "../utilities/matcher";

export const URI = "ParseResult";
export type URI = typeof URI;

declare module "fp-ts/HKT" {
  interface URItoKind<A> {
    [URI]: ParseResult<A>;
  }
}

export type ParseResult<A> = ParseOk<A> | ParseFail;
export type ParseOk<A> = Tagged<"ok", { parsed: A; rest: string }>;
export type ParseFail = Tagged<"fail", { error: string }>;

/* ----------------------------------------------------------------------------
 *
 * ----------------------------- Constructors ---------------------------------
 *
 * ------------------------------------------------------------------------- */
const ok = <const A>(parsed: A, rest: string): ParseResult<A> => ({
  tag: "ok",
  parsed,
  rest,
});

const fail = (error: string): ParseFail => ({
  tag: "fail",
  error,
});

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Operators -----------------------------------
 *
 * ------------------------------------------------------------------------- */

const map =
  <A>(result: ParseResult<A>) =>
  <B>(f: (a: A) => B) =>
    match.tagged(result).on({
      fail: (fail) => fail,
      ok: ({ parsed, rest }) => ok(f(parsed), rest),
    });

const withDefault =
  <A>(a: A) =>
  (result: ParseResult<A>) =>
    match.tagged(result).on({
      fail: () => a,
      ok: ({ parsed }) => parsed,
    });

export const ParseResult = {
  ok,
  fail,
  map,
  withDefault,
};
