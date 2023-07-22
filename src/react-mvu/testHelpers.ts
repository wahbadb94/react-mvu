import { expect } from "vitest";
import { Parser } from "./Parser";
import { ParseOk, ParseResult } from "./ParseResult";

function failWhenEmpty<A>(parser: Parser<A>) {
  const result = parser.fn("");
  expect(result.tag).toBe("fail");
}

const expectMapOk = <A, B>(result: ParseResult<A>, f: (a: ParseOk<A>) => B) => {
  if (result.tag === "fail") {
    expect(result.error).toBe("");
  }
  expect(result.tag).toBe("ok");
  if (result.tag !== "ok") return;

  f(result);
};

export default {
  failWhenEmpty,
  expectMapOk,
};
