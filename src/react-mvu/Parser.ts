import { pipe } from "fp-ts/lib/function";
import match from "../utilities/matcher";
import { Option } from "./Option";
import { ParseResult } from "./ParseResult";
import { Monad, Monad1 } from "fp-ts/lib/Monad";
import { Do as _Do } from "fp-ts-contrib/lib/Do";

const { ok, fail } = ParseResult;

/* ----------------------------------------------------------------------------
 *
 * --------------------------------- Types ------------------------------------
 *
 * ------------------------------------------------------------------------- */

export const URI = "Parser";
export type URI = typeof URI;

declare module "fp-ts/HKT" {
  interface URItoKind<A> {
    [URI]: Parser<A>;
  }
}

export type Parser<A> = { fn: ParserFn<A> };
type ParserFn<A> = (input: string) => ParseResult<A>;

/* ----------------------------------------------------------------------------
 *
 * ------------------------------- Operatora ----------------------------------
 *
 * ------------------------------------------------------------------------- */

const parse = <A>({ fn }: Parser<A>) => fn;

const map =
  <A>(parser: Parser<A>) =>
  <const B>(f: (a: A) => B): Parser<B> => ({
    fn: (str) => ParseResult.map(parser.fn(str))(f),
  });

const bind =
  <A>(parser: Parser<A>) =>
  <const B>(f: (a: A) => Parser<B>): Parser<B> => ({
    fn: (str) =>
      match.tagged(parser.fn(str)).on({
        fail: (f) => f,
        ok: ({ parsed, rest }) => f(parsed).fn(rest),
      }),
  });

const unit = <const A>(a: A): Parser<A> => ({
  fn: (str) => ok(a, str),
});

const apply =
  <A, const B>(fP: Parser<(a: A) => B>) =>
  (xP: Parser<A>) =>
    bind(fP)((f) => bind(xP)((a) => unit(f(a))));

const lift2 =
  <A, B, C>(f: (a: A) => (b: B) => C) =>
  (xP: Parser<A>) =>
  (yP: Parser<B>) =>
    pipe(
      unit(f),
      (fP) => apply(fP)(xP),
      (fP) => apply(fP)(yP)
    );

/* ----------------------------------------------------------------------------
 *
 * --------------------------- Type Classes / Do ------------------------------
 *
 * ------------------------------------------------------------------------- */

const Monad: Monad1<URI> = {
  URI,
  of: unit,
  ap: (fab, fa) => apply(fab)(fa),
  map: (fa, f) => map(fa)(f),
  chain: (fa, f) => bind(fa)(f),
};

const Do = _Do(Monad);

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Combinators ---------------------------------
 *
 * ------------------------------------------------------------------------- */

const both =
  <A>(parser1: Parser<A>) =>
  <B>(parser2: Parser<B>) =>
    Do.bind("a", parser1)
      .bind("b", parser2)
      .return(({ a, b }) => [a, b] as const);

const left =
  <L>(parserL: Parser<L>) =>
  <R>(parserR: Parser<R>) =>
    Do.bind("l", parserL)
      .bind("r", parserR)
      .return(({ l }) => l);

const right =
  <L>(parserL: Parser<L>) =>
  <R>(parserR: Parser<R>) =>
    Do.bind("l", parserL)
      .bind("r", parserR)
      .return(({ r }) => r);

const between =
  <L>(pL: Parser<L>) =>
  <M>(pM: Parser<M>) =>
  <R>(pR: Parser<R>) =>
    Do.bind("l", pL)
      .bind("m", pM)
      .bind("r", pR)
      .return(({ m }) => m);

const peek = <A>(parser: Parser<A>): Parser<A> => ({
  fn: (input) =>
    match.tagged(parser.fn(input)).on<ParseResult<A>>({
      fail: (f) => f,
      ok: ({ parsed }) => ok(parsed, input),
    }),
});

const sepBy1 =
  <Sep>(sepaator: Parser<Sep>) =>
  <A>(p: Parser<A>) => {
    const sepThenP = right(sepaator)(p);
    const firstThenList = both(p)(many0(sepThenP));
    return map(firstThenList)(([p, pList]) => [p, ...pList] as A[]);
  };

const sepBy0 =
  <Sep>(sepaator: Parser<Sep>) =>
  <A>(parser: Parser<A>) =>
    either(sepBy1(sepaator)(parser))(unit([] as A[]));

const parseZeroOrMore =
  <A>(parser: Parser<A>) =>
  (input: string): [A[], string] =>
    match.tagged(parser.fn(input)).on({
      fail: () => [[], input],
      ok: ({ parsed, rest }) =>
        pipe(
          parseZeroOrMore(parser)(rest),
          ([subsequentValues, remainingInput]) => [
            [parsed, ...subsequentValues],
            remainingInput,
          ]
        ),
    });

const many0 = <A>(parser: Parser<A>): Parser<A[]> => ({
  fn: (str) => ok(...parseZeroOrMore(parser)(str)),
});

const many1 = <A>(parser: Parser<A>) =>
  Do.bind("head", parser)
    .bind("tail", many0(parser))
    .return(({ head, tail }) => [head, ...tail]);

const either =
  <A>(parser1: Parser<A>) =>
  <B>(parser2: Parser<B>): Parser<A | B> => ({
    fn: (str) => {
      const result1 = parser1.fn(str);
      if (result1.tag === "ok") return result1;

      return parser2.fn(str);
    },
  });

const seq = <P extends Parser<unknown>[]>(...parsers: P): Parser<SeqOf<P>> => ({
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

const opt = <A>(parser: Parser<A>): Parser<Option<A>> => {
  const _some = map(parser)(Option.some);
  const _none = unit(Option.none as Option<A>);
  return either(_some)(_none);
};

const exact = <A>(parser: Parser<A>): Parser<A> => ({
  fn: (str) =>
    match.tagged(parser.fn(str)).on({
      fail: (f) => f,
      ok: (ok) =>
        ok.rest.length > 0
          ? fail(
              `Parser was specified as "complete". Parsed "${ok.parsed}", but had "${ok.rest}" left over.`
            )
          : ok,
    }),
});

export type SeqOf<P extends Parser<unknown>[]> = {
  [Index in keyof P]: P[Index] extends Parser<infer U> ? U : never;
};

const oneOf = <P extends Parser<unknown>[]>(
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

export const erase = Symbol();

const erasable = (parser: Parser<unknown>): Parser<typeof erase> =>
  map(parser)(() => erase);

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Parsers -----------------------------------
 *
 * ------------------------------------------------------------------------- */

const s = <S extends string>(s: S): Parser<S> => ({
  fn: (str) =>
    str.substring(0, s.length) === s
      ? ok(s, str.substring(s.length))
      : fail(`could not parse ${s}" from "${str}"`),
});

const anyOf = <S extends string[]>(...strings: S): Parser<S[number]> =>
  oneOf(...strings.map((str: S[number]) => s(str)));

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const charsLower = [
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
const charsUpper = charsLower.map(
  (c) => c.toUpperCase() as Uppercase<typeof c>
);
const chars = [...charsLower, ...charsUpper];
const alpha = anyOf(...chars);
const word = map(many1(alpha))((chars) => chars.join(""));

const digit = anyOf(...digits);
const digitN = map(digit)(Number);

const int = map(many1(digitN))((digits) =>
  [...digits] // make a copy, and reverse for easy base10 calculation
    .reverse()
    .reduce((sum, digit, index) => sum + digit * Math.pow(10, index), 0)
);

const alphaNumericChar = either(digit)(alpha);
const alphaNumericString = map(many1(alphaNumericChar))((chars) =>
  chars.join("")
);

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Builder -----------------------------------
 *
 * ------------------------------------------------------------------------- */

interface ParserBuilder<A> {
  parser: Parser<A>;
  map: <const B>(f: (a: A) => B) => ParserBuilder<B>;
  andThen: <const B>(f: (a: A) => ParserBuilder<B>) => ParserBuilder<B>;
}

const builder = <A>(parser: Parser<A>): ParserBuilder<A> => ({
  parser,
  map: <const B>(f: (a: A) => B) => builder(map(parser)(f)),
  andThen: <const B>(f: (a: A) => ParserBuilder<B>) =>
    builder(bind(parser)((a) => f(a).parser)),
});

export const ParserBuilder = {
  s: <const S extends string>(str: S) => builder(s(str)),
  int: builder(int),
  digit: builder(digit),
  digitN: builder(digitN),
  alpha: builder(alpha),
  word: builder(word),
  alphaNumericChar: builder(alphaNumericChar),
  alphaNumericString: builder(alphaNumericString),
};

/* ----------------------------------------------------------------------------
 *
 * ------------------------------- Url Parsing --------------------------------
 *
 * ------------------------------------------------------------------------- */

export const Parser = {
  parse,
  map,
  bind,
  unit,
  apply,
  lift2,
  s,
  int,
  alpha,
  word,
  digit,
  digitN,
  alphaNumericChar,
  alphaNumericString,
  anyOf,
  oneOf,
  opt,
  seq,
  both,
  either,
  many0,
  many1,
  sepBy0,
  sepBy1,
  exact,
  left,
  right,
  between,
  ok,
  fail,
  builder,
  peek,
  Do,
  erasable,
  erase,
};
