import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
import { Option } from "../../react-mvu/Option";
import { Parser, int, oneOf, opt, s, seq } from "../../react-mvu/Parser";
import pokemonService, {
  FetchPokemonResponse,
  GetListParams,
} from "../../services/pokemonService";
import match, { Tagged, Constructors } from "../../utilities/matcher";
import { ModelUpdate } from "../../react-mvu/types";

export type Model = {
  pokemonListResponse: RemoteData<FetchPokemonResponse>;
} & GetListParams;

export type Msg =
  | Tagged<"gotPokemon", { response: FetchPokemonResponse }>
  | Tagged<"fetchPokemon", GetListParams>;
const Msg = Constructors<Msg>();

// URL
const baseParser = seq(s("/pokemon"), opt(s("/")));

// TODO: better API for parsing a query string portion of the URL
const offset = Parser.map(([, offset]) => ({ offset }), seq(s("offset="), int));
const limit = Parser.map(([, limit]) => ({ limit }), seq(s("limit="), int));
const queryParam = oneOf(offset, limit);

const searchParamsParser = Parser.map(
  ([, p1Maybe, , p2Maybe]) =>
    Option.flatMap(p1Maybe).to((p1) =>
      Option.map(p2Maybe).to(
        (p2) => ({ ...p1, ...p2 } as Partial<GetListParams>)
      )
    ),
  seq(s("?"), opt(queryParam), opt(s("&")), opt(queryParam))
);

const parser = seq(baseParser, opt(searchParamsParser));

export const { init, parseUrl, update }: ModelUpdate<Model, Msg> = {
  init: () => [
    { pokemonListResponse: RemoteData.notStarted, limit: 20, offset: 0 },
    Cmd.none,
  ],
  update: ({ limit, offset }, msg) =>
    match.tagged(msg).on({
      gotPokemon: ({ response }) => [
        {
          pokemonListResponse: RemoteData.succeeded(response),
          limit,
          offset,
        },
        Cmd.none,
      ],
      fetchPokemon: ({ limit, offset }) => {
        const [cmd, cachedData] = pokemonService.getList(
          { limit, offset },
          (response) => Msg("gotPokemon")({ response })
        );

        return [
          {
            pokemonListResponse: RemoteData.mapCache(cachedData),
            limit,
            offset,
          },
          cmd,
        ];
      },
    }),
  parseUrl: ({ pokemonListResponse }) =>
    Parser.map(([, searchParams]) => {
      const { limit, offset } = match.tagged(searchParams).on({
        none: () => ({ limit: 20, offset: 0 }),
        some: ({ data }) =>
          match.tagged(data).on({
            none: () => ({ limit: 20, offset: 0 }),
            some: ({ data: { limit = 20, offset = 0 } }) => ({ limit, offset }),
          }),
      });

      const [cmd, cachedData] = pokemonService.getList(
        { limit, offset },
        (response) => Msg("gotPokemon")({ response })
      );

      const placeholder = match.tagged(pokemonListResponse).on({
        succeeded: ({ data }) => data,
        inProgress: ({ placeholder }) => placeholder,
        failed: () => undefined,
        notStarted: () => undefined,
      });

      return [
        {
          pokemonListResponse: RemoteData.mapCache(cachedData, placeholder),
          limit,
          offset,
        },
        cmd,
      ];
    }, parser),
};
