import { describe, expect, it } from "vitest";
import { erase, splitToParts, UrlParser } from "./UrlParser2";
import testHelpers from "./testHelpers";

const { path, s, top, int, search } = UrlParser;
const { expectMapOk } = testHelpers;

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Parsers -----------------------------------
 *
 * ------------------------------------------------------------------------- */

describe("#splitToParts", () => {
  it("is empty for the base pathname", () => {
    const parts = splitToParts("/");

    expect(parts.length).toBe(0);
  });

  it("gives exactly one correct part for first level child pathname", () => {
    const parts = splitToParts("/pokemon");

    expect(parts.length).toBe(1);
    expect(parts[0]).toBe("pokemon");
  });

  it("ignores trailing slashes", () => {
    const parts = splitToParts("/pokemon/");

    expect(parts.length).toBe(1);
    expect(parts[0]).toBe("pokemon");
  });
});

describe("#s", () => {
  it("parses an `Eraseable` when it succeeds", () => {
    const result = s("/pokemon").fn("/pokemon");
    expect(result.tag).toBe("ok");
    if (result.tag !== "ok") return;

    expect(result.parsed === erase).toBe(true);
  });
});

describe("#top", () => {
  it("matches the toplevel pathname", () => {
    expect(top.fn("/").tag).toBe("ok");
  });

  it("is exact, and doesn't match anything longer", () => {
    expect(top.fn("/pokemon").tag).toBe("fail");
  });
});

describe("#search", () => {
  // testing int/int?
  it("parses a required int", () => {
    const result = search({ limit: "int" }).fn("limit=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(true);
      expect(typeof parsed.limit === "number").toBe(true);
      expect(parsed.limit).toBe(20);
    });
  });

  it("fails when queryString is missing required int", () => {
    const result = search({ limit: "int" }).fn("offset=20");
    expect(result.tag).toBe("fail");
  });

  it("parses an optional int when it exists", () => {
    const result = search({ limit: "int?" }).fn("limit=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(true);
      expect(typeof parsed.limit === "number").toBe(true);
      expect(parsed.limit).toBe(20);
    });
  });

  it("doesn't parse an optional int when it doesn't exist", () => {
    const result = search({ limit: "int?" }).fn("offset=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(false);
      expect(Object.keys(parsed).length).toBe(0);
    });
  });

  // testing str/str?
  it("parses a required str", () => {
    const result = search({ limit: "str" }).fn("limit=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(true);
      expect(typeof parsed.limit === "string").toBe(true);
      expect(parsed.limit).toBe("20");
    });
  });

  it("fails when queryString is missing required str", () => {
    const result = search({ limit: "str" }).fn("offset=20");
    expect(result.tag).toBe("fail");
  });

  it("parses an optional str when it exists", () => {
    const result = search({ limit: "str?" }).fn("limit=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(true);
      expect(typeof parsed.limit === "string").toBe(true);
      expect(parsed.limit).toBe("20");
    });
  });

  it("doesn't parse an optional str when it doesn't exist", () => {
    const result = search({ limit: "str?" }).fn("offset=20");
    expectMapOk(result, ({ parsed }) => {
      expect("limit" in parsed).toBe(false);
      expect(Object.keys(parsed).length).toBe(0);
    });
  });
});

describe("#path", () => {
  const pokemon = path(s("pokemon"), int);
  const pokemonAbility = path(s("pokemon"), int, s("abilities"), int);

  it("will match an exact route", () => {
    const result = pokemonAbility.fn("/pokemon/25/abilities/13");
    expect(result.tag).toBe("ok");
  });

  it("won't match a more specific route", () => {
    const result = pokemon.fn("/pokemon/25/abilities/13");
    expect(result.tag).toBe("fail");
  });

  it("it won't match a less specific route", () => {
    const result = pokemonAbility.fn("/pokemon/25");
    expect(result.tag).toBe("fail");
  });

  it("filters out string literals from results", () => {
    const result = pokemonAbility.fn("/pokemon/25/abilities/13");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    // check it filtered out the string literals
    expect(result.parsed.length).toBe(2);

    // check it kept the two numbers, and maintained the order
    expect(result.parsed[0]).toBe(25);
    expect(result.parsed[1]).toBe(13);
  });

  it("unwraps a 1 element tuple", () => {
    const result = pokemon.fn("/pokemon/45");
    expect(result.tag).toBe("ok");
    if (result.tag === "fail") return;

    expect(typeof result.parsed === "number").toBe(true);
  });

  it("works with the search parser", () => {
    const parser = path(
      s("pokemon"),
      search({ limit: "int?", offset: "int?" })
    );

    const limitResult = parser.fn("/pokemon?limit=20");
    const offsetResult = parser.fn("/pokemon?offset=60");
    const bothResult = parser.fn("/pokemon?limit=20&offset=60");
    const neitherResult = parser.fn("/pokemon");

    expectMapOk(limitResult, ({ parsed }) => {
      expect(parsed.limit).toBe(20);
      expect("offset" in parsed).toBe(false);
    });

    expectMapOk(offsetResult, ({ parsed }) => {
      expect(parsed.offset).toBe(60);
      expect("limit" in parsed).toBe(false);
    });

    expectMapOk(bothResult, ({ parsed }) => {
      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(60);
    });

    expect(neitherResult.tag).toBe("fail");
  });
});
