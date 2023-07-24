import { Constructors, Tagged } from "./utilities/matcher";
import { UrlParser } from "./react-mvu/UrlParser";
import { pipe } from "fp-ts/lib/function";
import { Option } from "./react-mvu/Option";
import { ParseResult } from "./react-mvu/ParseResult";

/* ----------------------------------------------------------------------------
 *
 * -------------------------- Route Definition --------------------------------
 *
 * ------------------------------------------------------------------------- */

export type Route =
  | Tagged<"home">
  | Tagged<"pokemon", { offset: number; limit: number }>
  | Tagged<"pokeDetails", { id: number }>
  | Tagged<"notFound">;

export const Route = Constructors<Route>();

/* ----------------------------------------------------------------------------
 *
 * ---------------------------- Route Parsing ---------------------------------
 *
 * ------------------------------------------------------------------------- */

const { oneOf, map, s, int, top, path, search, intParam, opt } = UrlParser;

const route = {
  //  "/"
  home: path(top),

  // "/pokemon?offset=<int>&limit=<int>"
  pokemon: path(
    s("pokemon"),
    opt(search(intParam("offset"), intParam("limit")))
  ),

  // "/pokmeon/{id}"
  pokeDetails: path(s("pokemon"), int),
};

export const getRoute = (str: string) =>
  ParseResult.withDefault(Route("notFound")({}))(parseRoute.fn(str));

const parseRoute = oneOf(
  map(route.home)(() => Route("home")({})),

  map(route.pokemon)((params) =>
    pipe(
      params,
      Option.defaultValue({ limit: 20, offset: 0 }),
      Route("pokemon")
    )
  ),

  map(route.pokeDetails)((id) => Route("pokeDetails")({ id }))
);
