import { Tagged } from "../utilities/matcher";
import { Option } from "./Option";

export function test() {
  const parse3DigitStr = Parser.map(
    ([[a, b], c]) => `${a}${b}${c}` as const,
    andThen(andThen(digit)(digit))(digit)
  );
  const parse3DigitInt = Parser.map(Number, parse3DigitStr);
  console.log(run(parse3DigitInt, "123"));

  const pikachuUrl = seq(s("pokemon/"), s("pikachu/"), s("abilities/"));
  console.log(run(pikachuUrl, "pokemon/pikachu/abilities/14"));
}

/* ----------------------------------------------------------------------------
 *
 * ------------------------------- Operators ----------------------------------
 *
 * ------------------------------------------------------------------------- */

const run = <A>(parser: Parser<A>, s: string) => parser.fn(s);

const map = <A, const B>(f: (a: A) => B, parser: Parser<A>): Parser<B> => ({
  fn: (str) => {
    const result = run(parser, str);
    if (result.tag === "fail") return result;

    const { parsed, rest } = result;
    return ok(f(parsed), rest);
  },
});

const ret = <A>(a: A): Parser<A> => ({
  fn: (str) => ok(a, str),
});

const apply = <A, B>(fP: Parser<(a: A) => B>, xP: Parser<A>) =>
  map(([f, x]) => f(x), andThen(fP)(xP));

const lift2 =
  <A, B, C>(f: (a: A) => (b: B) => C) =>
  (xP: Parser<A>) =>
  (yP: Parser<B>) =>
    apply(apply(ret(f), xP), yP);

const parseZeroOrMore =
  <A>(parser: Parser<A>) =>
  (input: string): [A[], string] => {
    const firstResult = run(parser, input);
    if (firstResult.tag === "fail") return [[], input];

    const { parsed: firstValue, rest: inputAfterFirstParser } = firstResult;
    const [subsequentValues, remainingInput] = parseZeroOrMore(parser)(
      inputAfterFirstParser
    );

    return [[firstValue, ...subsequentValues], remainingInput];
  };

export const Parser = {
  run,
  map,
  ret,
  apply,
  lift2,
  parseZeroOrMore,
};

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Combinators ---------------------------------
 *
 * ------------------------------------------------------------------------- */

export const andThen =
  <A>(parser1: Parser<A>) =>
  <B>(parser2: Parser<B>): Parser<[A, B]> => ({
    fn: (str) => {
      const result1 = parser1.fn(str);
      if (result1.tag === "fail") return result1;

      const { parsed: parsed1, rest: rest1 } = result1;

      const result2 = parser2.fn(rest1);
      if (result2.tag === "fail") return result2;

      const { parsed: parsed2, rest: rest2 } = result2;

      return ok([parsed1, parsed2], rest2);
    },
  });

export const many = <A>(parser: Parser<A>): Parser<A[]> => ({
  fn: (str) => ok(...Parser.parseZeroOrMore(parser)(str)),
});

export const either =
  <A>(parser1: Parser<A>) =>
  <B>(parser2: Parser<B>): Parser<A | B> => ({
    fn: (str) => {
      const result1 = parser1.fn(str);
      if (result1.tag === "ok") return result1;

      return parser2.fn(str);
    },
  });

export const seq = <P extends Parser<unknown>[]>(
  ...parsers: P
): Parser<SeqOf<P>> => ({
  fn: (str) => {
    const seqParsed = [];
    let toParse = str;
    for (const parser of parsers) {
      const result = parser.fn(toParse);
      if (result.tag === "fail") return result;
      const { parsed, rest } = result;
      seqParsed.push(parsed);
      toParse = rest;
    }

    return ok(seqParsed as SeqOf<P>, toParse);
  },
});

export const opt = <A>(parser: Parser<A>): Parser<Option<A>> => {
  const _some = Parser.map(Option.some, parser);
  const _none = Parser.ret(Option.none as Option<A>);
  return either(_some)(_none);
};

type SeqOf<P extends Parser<unknown>[]> = {
  [Index in keyof P]: P[Index] extends Parser<infer U> ? U : never;
};

export const oneOf = <P extends Parser<unknown>[]>(
  ...parsers: P
): Parser<OneOf<P>> => ({
  fn: (str) =>
    parsers.reduce(
      (prevResult: ParseResult<OneOf<P>>, parser) =>
        prevResult.tag === "ok"
          ? prevResult
          : (parser.fn(str) as ParseResult<OneOf<P>>),
      fail("none of fthe parsers succeeded.") satisfies ParseResult<OneOf<P>>
    ),
});

type OneOf<P extends Parser<unknown>[]> = {
  [Index in keyof P]: P[Index] extends Parser<infer T> ? T : never;
}[number];

export const anyOf = <S extends string[]>(...strings: S): Parser<S[number]> =>
  oneOf(...strings.map((str: S[number]) => s(str)));

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Parsers -----------------------------------
 *
 * ------------------------------------------------------------------------- */

export const s = <S extends string>(s: S): Parser<S> => ({
  fn: (str) =>
    str.substring(0, s.length) === s
      ? ok(s, str.substring(s.length))
      : fail(`could not parse ${s}" from "${str}"`),
});

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const chars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;
const _alpha = anyOf(...chars);
export const alpha = either(_alpha)(
  Parser.map((s) => s.toUpperCase() as Uppercase<typeof s>, _alpha)
);
export const word = Parser.map((chars) => chars.join(""), many(alpha));

export const digit = anyOf(...digits);
export const digitN = Parser.map(Number, digit);

export const int = Parser.map(
  (digits) =>
    [...digits] // make a copy, and reverse for easy base10 calculation
      .reverse()
      .reduce((sum, digit, index) => sum + digit * Math.pow(10, index), 0),
  many(digitN)
);

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Constructors --------------------------------
 *
 * ------------------------------------------------------------------------- */

const ok = <A>(parsed: A, rest: string): ParseOk<A> => ({
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
 * --------------------------------- Types ------------------------------------
 *
 * ------------------------------------------------------------------------- */

export type Parser<A> = { fn: ParserFn<A> };
type ParserFn<A> = (str: string) => ParseResult<A>;
export type ParseResult<A> = ParseOk<A> | ParseFail;
export type ParseOk<A> = Tagged<"ok", { parsed: A; rest: string }>;
export type ParseFail = Tagged<"fail", { error: string }>;
