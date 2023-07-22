import { describe, expect, it } from "vitest";
import testHelpers from "./testHelpers";
import { UrlParser } from "./UrlParser3";
import { Parser } from "./Parser";
import { Option } from "./Option";

const { expectMapOk } = testHelpers;

const {
  top,
  search,
  intParam,
  int,
  path,
  s,
  strParam,
  params,
  pathPart,
  opt,
  left,
} = UrlParser;

describe("#top", () => {
  const validRoutes = ["", "/"];

  it("works with for valid top routes", () => {
    validRoutes.forEach((r) =>
      expectMapOk(top.fn(r), ({ parsed, rest }) => {
        expect(parsed).toBe("");
        expect(rest).toBe("");
      })
    );
  });
});

describe("#pathPart", () => {
  const pokeRoute = pathPart(Parser.s("pokemon"));

  it("parses with a leading slash", () => {
    expectMapOk(pokeRoute.fn("/pokemon/14"), ({ parsed, rest }) => {
      expect(parsed).toBe("pokemon");
      expect(rest).toBe("/14");
    });

    expectMapOk(pokeRoute.fn("/pokemon"), ({ parsed, rest }) => {
      expect(parsed).toBe("pokemon");
      expect(rest).toBe("");
    });
  });

  it("matches but does not consume a trailing slash", () => {
    expectMapOk(pokeRoute.fn("/pokemon/"), ({ parsed, rest }) => {
      expect(parsed).toBe("pokemon");
      expect(rest).toBe("/");
    });
  });

  const pokeRouteTop = left(pokeRoute)(top);
  const validTopLevelPokemonRoutes = ["/pokemon", "/pokemon/"];

  it("can be combined with top to fail against longer pathnames", () => {
    validTopLevelPokemonRoutes.forEach((r) =>
      expectMapOk(pokeRouteTop.fn(r), ({ parsed, rest }) => {
        expect(parsed).toBe("pokemon");
        expect(rest).toBe("");
      })
    );
  });
});

describe("#path", () => {
  const pokemonRoute = path(s("pokemon"));
  const pokeDetailsRoute = path(s("pokemon"), int);

  it("matches a single base path", () => {
    expectMapOk(pokemonRoute.fn("/pokemon"), ({ parsed, rest }) => {
      expect(parsed).toBe(undefined);
      expect(rest).toBe("");
    });
  });

  it("matches a single int subpath path, and returns the single int instead of an array", () => {
    expectMapOk(pokeDetailsRoute.fn("/pokemon/25"), ({ parsed, rest }) => {
      expect(parsed).toBe(25);
      expect(rest).toBe("");
    });
  });

  it("will not match a more specific subpath", () => {
    const result = pokeDetailsRoute.fn("/pokemon/25/abilities");
    expect(result.tag).toBe("fail");
  });

  const pokemonList = path(
    s("pokemon"),
    search(intParam("limit"), intParam("offset"))
  );

  it("works with required search params", () => {
    expectMapOk(
      pokemonList.fn("/pokemon?limit=10&offset=20"),
      ({ parsed, rest }) => {
        expect(parsed).toEqual({
          limit: 10,
          offset: 20,
        });

        expect(rest).toBe("");
      }
    );
  });

  const pokemonListOptParams = path(
    s("pokemon"),
    opt(search(intParam("limit"), intParam("offset")))
  );

  it("works with optional search params, when they exist", () => {
    expectMapOk(
      pokemonListOptParams.fn("/pokemon?limit=10&offset=20"),
      ({ parsed, rest }) => {
        expect(parsed).toEqual(
          Option.some({
            limit: 10,
            offset: 20,
          })
        );

        expect(rest).toBe("");
      }
    );
  });

  it("works with optional search params, when they don't exist", () => {
    expectMapOk(pokemonListOptParams.fn("/pokemon"), ({ parsed, rest }) => {
      expect(parsed).toEqual(Option.none);

      expect(rest).toBe("");
    });
  });
});

describe("#intParam", () => {
  const input = "answer=42&question=unknown";
  const parseAnswer = intParam("answer");

  it("parses an integer search param", () => {
    expectMapOk(parseAnswer.fn(input), ({ parsed, rest }) => {
      expect(parsed).toEqual({ answer: 42 });
      expect(rest).toBe("&question=unknown");
    });
  });
});

describe("#strParam", () => {
  const input = "search=howDoI";
  const parseAnswer = strParam("search");

  it("parses a string search param", () => {
    expectMapOk(parseAnswer.fn(input), ({ parsed, rest }) => {
      expect(parsed).toEqual({ search: "howDoI" });
      expect(rest).toBe("");
    });
  });
});

const searchString = "limit=10&query=lalala&offset=60#someHash";

describe("#params", () => {
  const searchParser = params(
    intParam("limit"),
    strParam("query"),
    intParam("offset")
  );

  it("matches multiple param kvp's separated by a '&'", () => {
    expectMapOk(searchParser.fn(searchString), ({ parsed, rest }) => {
      expect(parsed).toEqual({
        limit: 10,
        query: "lalala",
        offset: 60,
      });

      expect(rest).toBe("#someHash");
    });
  });

  const searchParserDiffOrder = params(
    intParam("offset"),
    intParam("limit"),
    strParam("query")
  );
  it("doesn't care about the order of param parsers", () => {
    expectMapOk(searchParserDiffOrder.fn(searchString), ({ parsed, rest }) => {
      expect(parsed).toEqual({
        limit: 10,
        query: "lalala",
        offset: 60,
      });

      expect(rest).toBe("#someHash");
    });
  });
});

describe("#search", () => {
  const searchParser = search(
    intParam("limit"),
    strParam("query"),
    intParam("offset")
  );

  it("fails without the leading '?' character", () => {
    expect(searchParser.fn(searchString).tag).toBe("fail");
  });

  it("it succeeds with the leading '?', character", () => {
    expectMapOk(searchParser.fn("?" + searchString), ({ parsed, rest }) => {
      expect(parsed).toEqual({
        limit: 10,
        query: "lalala",
        offset: 60,
      });

      expect(rest).toBe("#someHash");
    });
  });
});
