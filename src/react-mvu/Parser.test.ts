import { describe, expect, it } from "vitest";
import { Parser, ParserBuilder } from "./Parser";
import testHelpers from "./testHelpers";
import { ParseResult } from "./ParseResult";

const {
  s,
  erasable,
  erase,
  digit,
  alpha,
  int,
  alphaNumericChar,
  alphaNumericString,
  word,
  exact,
  both,
  sepBy1,
  sepBy0,
  many0,
  oneOf,
  unit,
  ok,
  bind,
  map,
  //left,
  peek,
  parse,
  //opt,
} = Parser;

const { expectMapOk } = testHelpers;

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

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(parseMeow);
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

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(digit);
  });
});

// TODO: anyOf

describe("#int", () => {
  it("parses a single number (stream of digits)", () => {
    const result = int.fn("1080 degrees");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(result.parsed).toBe(1080);
    expect(result.rest).toBe(" degrees");
  });

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(int);
  });
});

describe("#alpha", () => {
  it("parses a single lowercase aphlabetic character", () => {
    const result = alpha.fn("fABc");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;
    expect(result.parsed).toBe("f");
    expect(result.rest).toBe("ABc");
  });

  it("parses a single uppercase aphlabetic character", () => {
    const result = alpha.fn("FABc");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;
    expect(result.parsed).toBe("F");
    expect(result.rest).toBe("ABc");
  });

  it("fails for non alphabetic characters", () => {
    const result = alpha.fn("/meow");
    expect(result.tag).toBe("fail");
  });

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(alpha);
  });
});

describe("#alphaNumericChar", () => {
  // digits
  it("should consume only a single digit", () => {
    const result = alphaNumericChar.fn("123");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(result.parsed).toBe("1");
    expect(result.rest).toBe("23");
  });

  // characters
  it("parses a single lowercase aphlabetic character", () => {
    const result = alphaNumericChar.fn("fABc");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;
    expect(result.parsed).toBe("f");
    expect(result.rest).toBe("ABc");
  });

  it("parses a single uppercase aphlabetic character", () => {
    const result = alphaNumericChar.fn("FABc");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;
    expect(result.parsed).toBe("F");
    expect(result.rest).toBe("ABc");
  });

  it("fails for non alphabetic characters", () => {
    const result = alphaNumericChar.fn("/");
    expect(result.tag).toBe("fail");
  });

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(alphaNumericChar);
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

  it("fails when input is empty", () => {
    testHelpers.failWhenEmpty(word);
  });
});

describe("#alphaNumericStr", () => {
  it("parses a string", () => {
    testHelpers.expectMapOk(
      alphaNumericString.fn("meow"),
      ({ parsed, rest }) => {
        expect(parsed).toBe("meow");
        expect(rest).toBe("");
      }
    );
  });

  it("parses an int as a string", () => {
    testHelpers.expectMapOk(alphaNumericString.fn("42"), ({ parsed, rest }) => {
      expect(typeof parsed).toBe("string");
      expect(parsed).toBe("42");
      expect(rest).toBe("");
    });
  });

  const str = "TheAnswerIs42";
  const symbols = "%^&";

  it("parses an alphanumeric string", () => {
    testHelpers.expectMapOk(
      alphaNumericString.fn(str + symbols),
      ({ parsed, rest }) => {
        expect(parsed).toBe(str);
        expect(rest).toBe(symbols);
      }
    );
  });

  it("fails for special characters", () => {
    const result = alphaNumericString.fn(symbols + str);
    expect(result.tag).toBe("fail");
  });
});

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Combinators ---------------------------------
 *
 * ------------------------------------------------------------------------- */

describe("#both", () => {
  const parseA = s("A");
  const parseB = s("B");
  const parseAThenB = both(s("A"))(s("B"));

  it("fails when the first does", () => {
    const aResult = parseA.fn("X");
    const abResult = parseAThenB.fn("X");

    expect(aResult.tag).toBe("fail");
    expect(abResult.tag).toBe("fail");
  });
  it("fails when the second does", () => {
    const bResult = parseA.fn("X");
    const result = parseAThenB.fn("AX");

    expect(bResult.tag).toBe("fail");
    expect(result.tag).toBe("fail");
  });
  it("succeeds when both do", () => {
    const input = "AB";
    const aResult = parseA.fn(input);
    const abResult = parseAThenB.fn(input);

    expect(aResult.tag).toBe("ok");
    if (aResult.tag === "fail") return;
    expect(aResult.rest).toBe("B");

    const bResult = parseB.fn(aResult.rest);
    expect(bResult.tag).toBe("ok");
    if (bResult.tag === "fail") return;

    expect(abResult.tag).toBe("ok");
    if (abResult.tag !== "ok") return;

    const { parsed, rest } = abResult;
    expect(parsed[0]).toBe("A");
    expect(parsed[1]).toBe("B");
    expect(rest).toBe("");
  });
});

describe("#many0", () => {
  const parser = many0(digit);
  const zeroResult = parser.fn("xyz");
  const onceResult = parser.fn("1xyz");
  const nResult = parser.fn("54321xyz");

  it("will parse 0 times", () => {
    expect(zeroResult.tag).toBe("ok");
    if (zeroResult.tag === "fail") return;
    const { parsed, rest } = zeroResult;

    expect(parsed.length).toBe(0);
    expect(rest).toBe("xyz");
  });

  it("will parse once", () => {
    expect(onceResult.tag).toBe("ok");
    if (onceResult.tag === "fail") return;

    const { parsed, rest } = onceResult;
    expect(parsed.length).toBe(1);
    expect(parsed[0]).toBe("1");
    expect(rest).toBe("xyz");
  });

  it("will parse n times", () => {
    expect(nResult.tag).toBe("ok");
    if (nResult.tag !== "ok") return;

    const { parsed, rest } = nResult;

    expect(parsed.length).toBe(5);

    [5, 4, 3, 2, 1].forEach((expected, index) =>
      expect(parsed.at(index)).toBe(expected.toString())
    );

    expect(rest).toBe("xyz");
  });
});

// TODO: many1

// TODO: either

// TODO: seq

// TODO: opt

describe("#sepBy1", () => {
  const csvInt = sepBy1(s(","))(int);
  const input = "14,10,53&limit=10";

  it("parses separated values", () => {
    expectMapOk(csvInt.fn(input), ({ parsed, rest }) => {
      expect(parsed).toEqual([14, 10, 53]);
      expect(rest).toBe("&limit=10");
    });
  });
});

describe("#sepBy0", () => {
  const csvInt = sepBy0(s(","))(int);

  const noParseInput = "notACsv";
  it("succeeds when there's nothing to parse", () => {
    expectMapOk(csvInt.fn(noParseInput), ({ parsed, rest }) => {
      expect(parsed).toEqual([]);
      expect(rest).toBe(noParseInput);
    });
  });

  const input = "14,10,53&limit=10";
  it("parses separated values", () => {
    expectMapOk(csvInt.fn(input), ({ parsed, rest }) => {
      expect(parsed).toEqual([14, 10, 53]);
      expect(rest).toBe("&limit=10");
    });
  });
});

describe("#oneOf", () => {
  const parseFoo = s("foo");
  const parseBar = s("bar");
  const parseBaz = s("baz");

  const parser = oneOf(parseFoo, parseBar, parseBaz);

  it("it succeeds and gives the result of whichever was the match", () => {
    testHelpers.expectMapOk(parser.fn("fooBarBaz"), ({ parsed, rest }) => {
      expect(parsed).toBe("foo");
      expect(rest).toBe("BarBaz");
    });

    testHelpers.expectMapOk(parser.fn("barBazFoo"), ({ parsed, rest }) => {
      expect(parsed).toBe("bar");
      expect(rest).toBe("BazFoo");
    });

    testHelpers.expectMapOk(parser.fn("bazFooBar"), ({ parsed, rest }) => {
      expect(parsed).toBe("baz");
      expect(rest).toBe("FooBar");
    });
  });

  it("fails when none match", () => {
    const result = parser.fn("zooBarBaz");
    expect(result.tag).toBe("fail");
  });
});

describe("#exact", () => {
  const p = exact(s("meow"));

  const successResult = p.fn("meow");
  const failResult = p.fn("meowAndStuff");

  it("it succeeds when it parses the entirety of the input string", () => {
    expect(successResult.tag).toBe("ok");
    if (successResult.tag === "fail") return;

    expect(successResult.parsed).toBe("meow");
    expect(successResult.rest).toBe("");
  });

  it("it fails when there is text left to parser", () => {
    expect(failResult.tag).toBe("fail");
  });
});

describe("#peek", () => {
  const peekAbc = peek(s("abc"));
  const input = "abc123";

  it("doesn't consume when it succeeds", () => {
    expectMapOk(parse(peekAbc)(input), ({ parsed, rest }) => {
      expect(parsed).toBe("abc");
      expect(rest).toBe(input);
    });
  });
});

/* ----------------------------------------------------------------------------
 *
 * ------------------------------- Operators ----------------------------------
 *
 * ------------------------------------------------------------------------- */

//TODO: unit
describe("#unit", () => {
  it("creates a valid parser from a value", () => {
    const alwaysParse = "meow";
    const inputString = "lalala";
    const parser = unit(alwaysParse);

    expect(parser.fn).toBeTruthy();

    expectMapOk(parser.fn(inputString), ({ parsed, rest }) => {
      expect(parsed).toBe(alwaysParse);
      expect(rest).toBe(inputString);
    });
  });
});

//TODO: apply
//describe("#apply", () => {})

describe("#map", () => {
  it("transforms the result", () => {
    const pMEOW = map(s("meow"))((m) => m.toUpperCase());
    expectMapOk(pMEOW.fn("meowAndStuff"), ({ parsed, rest }) => {
      expect(parsed).toBe("MEOW");
      expect(rest).toBe("AndStuff");
    });
  });
});

describe("#bind", () => {
  it("consumes the first, and passes the rest to the second", () => {
    const pHello = s("hello ");
    const pWorld = s("world");

    const result = bind(pHello)(() => pWorld).fn("hello world!!!");

    expectMapOk(result, ({ parsed, rest }) => {
      expect(parsed).toBe("world");
      expect(rest).toBe("!!!");
    });
  });

  it("can be used for type-safe parser chaining", () => {
    const pAbc = s("abc");
    const p123 = s("123");
    const pXyz = s("xyz");

    const input = "abc123xyz789";

    const abcThen123 = bind(pAbc)((r1) =>
      bind(p123)((r2) => map(pXyz)((r3) => [r1, r2, r3]))
    );

    const result = abcThen123.fn(input);

    expectMapOk(result, ({ parsed, rest }) => {
      expect(parsed).toEqual(["abc", "123", "xyz"]);
      expect(rest).toBe("789");
    });
  });
});

describe("#builder", () => {
  it("provides a more OO style builder pattern for mapping and binding", () => {
    const { s } = ParserBuilder;
    const pAbc = s("abc");
    const p123 = s("123");
    const pXyz = s("xyz");

    const { parser } = pAbc.andThen((r1) =>
      p123.andThen((r2) => pXyz.map((r3) => [r1, r2, r3]))
    );

    expectMapOk(parser.fn("abc123xyz789"), ({ parsed, rest }) => {
      expect(parsed).toEqual(["abc", "123", "xyz"]);
      expect(rest).toBe("789");
    });
  });
});

describe("#erasable", () => {
  const eraseableInt = erasable(int);
  const eraseableMeow = erasable(s("meow"));

  it("maps whatever it parses to 'erasable'", () => {
    expectMapOk(eraseableInt.fn("42meow89"), ({ parsed, rest }) => {
      expect(parsed).toBe(erase);
      expect(rest).toBe("meow89");
    });

    expectMapOk(eraseableMeow.fn("meow89"), ({ parsed, rest }) => {
      expect(parsed).toBe(erase);
      expect(rest).toBe("89");
    });
  });

  it("still fails when the inner parser does", () => {
    const result = eraseableMeow.fn("42");
    expect(result.tag).toBe("fail");
  });
});

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ ParseResult ---------------------------------
 *
 * ------------------------------------------------------------------------- */

describe("#ParseResult", () => {
  const { map } = ParseResult;
  it("can map", () => {
    const result = map(ok("hello", "world"))(
      (hello) => hello.toUpperCase() as Uppercase<"hello">
    );

    expectMapOk(result, ({ parsed, rest }) => {
      expect(parsed).toBe("HELLO");
      expect(rest).toBe("world");
    });
  });
});
