import { describe, expect, it } from "vitest";
import { s, digit, alpha, word } from "./Parser";
import { int } from "./Parser";

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Parsers -----------------------------------
 *
 * ------------------------------------------------------------------------- */

describe("#s", () => {
  const parseMeow = s("meow");
  const successResult = parseMeow.fn("meowAndStuff");
  it("matches the string it should", () => {
    expect(successResult.tag).toBe("ok");
    if (successResult.tag === "fail") return;

    expect(successResult.parsed).toBe("meow");
    expect(successResult.rest).toBe("AndStuff");
  });

  it("it fails after partial match", () => {
    const failResult = parseMeow.fn("meoZ");
    expect(failResult.tag).toBe("fail");
  });
});

describe("#digit", () => {
  Array.from(Array(10).keys())
    .map((n) => n.toString())
    .forEach((n) => {
      it(`parses the "${n}" digit`, () => {
        const result = digit.fn(n);
        expect(result.tag).toBe("ok");
        if (result.tag === "fail") return;

        expect(result.parsed).toBe(n);
        expect(result.rest).toBe("");
      });
    });

  it("should consume only a single digit", () => {
    const result = digit.fn("123");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(result.parsed).toBe("1");
    expect(result.rest).toBe("23");
  });

  it("fails for non digit input strings", () => {
    const result = digit.fn("s123");
    expect(result.tag).toBe("fail");
  });
});

describe("#int", () => {
  it("parses a single number (stream of digits)", () => {
    const result = int.fn("1080 degrees");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(result.parsed).toBe(1080);
    expect(result.rest).toBe(" degrees");
  });
});

describe("#alpha", () => {
  it("parses a single aphlabetic character", () => {
    const result = alpha.fn("fABc");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;
    expect(result.parsed).toBe("f");
    expect(result.rest).toBe("ABc");
  });

  it("fails for non alphabetic characters", () => {
    const result = alpha.fn("/meow");
    expect(result.tag).toBe("fail");
  });
});

describe("#word", () => {
  it("parses a single word, no special characters are allowed", () => {
    const result = word.fn("squirtle/abilities");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(result.parsed).toBe("squirtle");
    expect(result.rest).toBe("/abilities");
  });
});

// TODO: write tests for the combinators
/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Combinators ---------------------------------
 *
 * ------------------------------------------------------------------------- */

// TODO: write tests for the operators
/* ----------------------------------------------------------------------------
 *
 * ------------------------------- Operators ----------------------------------
 *
 * ------------------------------------------------------------------------- */
