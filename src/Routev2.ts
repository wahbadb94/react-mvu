import { Parser } from "./react-mvu/Parser";
import { Expand } from "./react-mvu/types";
import { Constructors, Tagged } from "./utilities/matcher";

/**
 *    1. have the above be the source of truth
 *    2. ex:
 *            ->  pokemon: /pokemon/:id                   <route>: <path>
 * 
 *            ->  ["pokemon", [ "id", number ]]           strings get parsed but not mapped, tuples are kvps that will be mapped
 * 
 *            ->  [s("pokemon"), int], [null, "id"]       [parsers], [keys] - pair of tuples, parses and keys for parsed, indices match up
 * 
 *            ->  parser = map(path(s("pokemon"), int))(([pokemon, number]) => keys.reduce(...) |> tagged(<route>))
 * 
 *    3. "/pokemon/:id" => Tagged<'pokemon', { id: number }>
 *          a. write a type def that can to the above
 *          b. write a second type def that iterates over the keys of `route2` above
 *          c. be able to infer the type `Route` from 3b.
 *            i.e.: type Route = Infer<typeof route2>;
 *    4. the final api should be as simple as:
 * 
          const { matchRoute, Route } = routes({
            home: "/",

            path: `/pokemon?offset=0?limit=20?search=`,

            pokeDetails: "/pokemon/:id",

            pokeAbilities: "/pokemon/:id/abilities/@ability",
          })

          type Route = Infer<typeof Route>;
 */

const route = {
  home: "/",
  pokemon: {
    path: "/pokemon",
    params: {
      limit: "int",
      offset: "int",
    },
  },
  pokeDetails: "/pokemon/:id",
  pokeAbilities: "/pokemon/:id/abilities/@ability",
} as const;

const pokePath = "/pokemon";
const pokeDetailsPath = "/pokemon/:id";

type PathTuple<S extends string, Parts extends unknown[] = []> = S extends ""
  ? Parts
  : S extends `${infer Base}/${infer Rest}`
  ? Base extends ""
    ? PathTuple<Rest, Parts>
    : PathTuple<Rest, [...Parts, PathVariable<Base>]>
  : PathTuple<"", [...Parts, PathVariable<S>]>;

type PathVariable<S extends string> = S extends `:${infer Key}`
  ? [Key, number]
  : S extends `@${infer Key}`
  ? [Key, string]
  : S;

type PokeTest = PathTuple<(typeof route)["pokemon"]["path"]>;
//    ^?

type DetailsTest = PathTuple<typeof pokeDetailsPath>;
//    ^?

type AbilitiesTest = PathTuple<"/pokemon/:id/abilities/@ability">;
//    ^?

type PathParserFromTuple<
  T extends unknown[],
  Parsers extends unknown[] = [],
  Keys extends unknown[] = []
> = T extends []
  ? [Parsers, Keys]
  : T extends [infer Head, ...infer Tail]
  ? Head extends [infer K, infer V]
    ? V extends string
      ? PathParserFromTuple<Tail, [...Parsers, Parser<string>], [...Keys, K]>
      : V extends number
      ? PathParserFromTuple<Tail, [...Parsers, Parser<number>], [...Keys, K]>
      : never
    : PathParserFromTuple<Tail, [...Parsers, Parser<Head>], [...Keys, null]>
  : never;

type DetailsTuplePair = PathParserFromTuple<DetailsTest>;
//    ^?

type AbilitiesTuplePair = PathParserFromTuple<AbilitiesTest>;
//    ^?

type PathTuplePairToMappedData<
  T extends [unknown[], unknown[]],
  KVP = unknown
> = T extends []
  ? Expand<KVP>
  : T extends [infer Parsers, infer Keys]
  ? Parsers extends [infer P1, ...infer RestParsers]
    ? Keys extends [infer K1, ...infer RestKeys]
      ? P1 extends Parser<infer T>
        ? K1 extends null
          ? PathTuplePairToMappedData<[RestParsers, RestKeys], KVP>
          : K1 extends string
          ? PathTuplePairToMappedData<
              [RestParsers, RestKeys],
              KVP & { [K in K1]: T }
            >
          : never
        : never
      : Expand<KVP>
    : Expand<KVP>
  : never;

type DetailsMappedTest = PathTuplePairToMappedData<DetailsTuplePair>;
//     ^?

type AbilitiesMappedTest = PathTuplePairToMappedData<AbilitiesTuplePair>;
//     ^?

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
//////////////                  Type Inference                /////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

const route2 = {
  home: "/",
  pokemon: `/pokemon?offset=0?limit=20?search=`,
  pokeDetails: "/pokemon/:id",
  pokeAbilities: "/pokemon/:id/abilities/@ability",
} as const;

const Route2 = Constructors<Route2>();

type Route2 = Infer<typeof route2>;
//    ^?

type Infer<M extends Record<string, string>> = {
  [R in keyof RouteMap<M>]: RouteMap<M>[R];
}[keyof RouteMap<M>];

type RouteMap<M extends Record<string, string>> = {
  [RouteName in keyof M]: RouteName extends string
    ? Expand<TaggedPath<M[RouteName], RouteName>>
    : never;
};

type TaggedPath<S extends string, Name extends string> = Tagged<
  Name,
  PathCaseData<PathTuple<S>>
>;

// eslint-disable-next-line @typescript-eslint/ban-types
type PathCaseData<P extends unknown[], Data = {}> = P extends []
  ? { [K in keyof Data]: Data[K] }
  : P extends [infer Head, ...infer Tail]
  ? Head extends [infer Key, infer T]
    ? Key extends string
      ? PathCaseData<Tail, Data & { [K in Key]: T }>
      : never
    : PathCaseData<Tail, Data>
  : never;
