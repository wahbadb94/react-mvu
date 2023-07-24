import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
import pokemonService, {
  FetchPokemonResponse,
  GetListParams,
} from "../../services/pokemonService";
import match, { Tagged, Constructors } from "../../utilities/matcher";

export type Model = {
  pokemonListResponse: RemoteData<FetchPokemonResponse>;
} & GetListParams;

export type Msg =
  | Tagged<"gotPokemon", { response: FetchPokemonResponse }>
  | Tagged<"fetchPokemon", GetListParams>;

const Msg = Constructors<Msg>();

export const init = (params: GetListParams): [Model, Cmd<Msg>] => {
  const [cmd, cachedData] = pokemonService.getList(params, (response) =>
    Msg("gotPokemon")({ response })
  );

  return [
    {
      pokemonListResponse: RemoteData.mapCache(cachedData),
      ...params,
    },
    cmd,
  ];
};

export const update = ({ limit, offset }: Model, msg: Msg): [Model, Cmd<Msg>] =>
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
  });
