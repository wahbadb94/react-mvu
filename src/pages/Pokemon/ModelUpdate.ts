import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
const { opt, s, search, intParam, path } = UrlParser;
import pokemonService, {
  FetchPokemonResponse,
  GetListParams,
} from "../../services/pokemonService";
import match, { Tagged, Constructors } from "../../utilities/matcher";
import { ModelUpdate } from "../../react-mvu/types";
import { UrlParser } from "../../react-mvu/UrlParser3";

export type Model = {
  pokemonListResponse: RemoteData<FetchPokemonResponse>;
} & GetListParams;

export type Msg =
  | Tagged<"gotPokemon", { response: FetchPokemonResponse }>
  | Tagged<"fetchPokemon", GetListParams>;
const Msg = Constructors<Msg>();

// URL
const parser = path(
  s("pokemon"),
  opt(search(intParam("offset"), intParam("limit")))
);

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
    UrlParser.map(parser)((searchParams) => {
      const { limit, offset } = match.tagged(searchParams).on({
        none: () => ({ limit: 20, offset: 0 }),
        some: ({ data }) => data,
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
    }),
};
