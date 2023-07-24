import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
import { Pokemon } from "../../models/Pokemon";
import match, { Tagged, Constructors } from "../../utilities/matcher";
import pokemonService from "../../services/pokemonService";

export type Model = {
  pokemon: RemoteData<Pokemon>;
  backToListUrl: string;
};

export type Msg = Tagged<"gotPokemon", { pokemon: Pokemon }>;
const Msg = Constructors<Msg>();

export const init = (id: number): [Model, Cmd<Msg>] => {
  const [cmd, cachedData] = pokemonService.getById(id, (pokemon) =>
    Msg("gotPokemon")({ pokemon })
  );
  return [
    { pokemon: RemoteData.mapCache(cachedData), backToListUrl: "/pokemon/" },
    cmd,
  ];
};

export const update = ({ backToListUrl }: Model, msg: Msg): [Model, Cmd<Msg>] =>
  match.tagged(msg).on({
    gotPokemon: ({ pokemon }) => [
      { backToListUrl, pokemon: RemoteData.succeeded(pokemon) },
      Cmd.none,
    ],
  });
