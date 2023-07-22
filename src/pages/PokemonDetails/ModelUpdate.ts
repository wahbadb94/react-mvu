import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
import { Pokemon } from "../../models/Pokemon";
import pokemonService from "../../services/pokemonService";
import match, { Tagged, Constructors } from "../../utilities/matcher";
import { ModelUpdate } from "../../react-mvu/types";
import { UrlParser } from "../../react-mvu/UrlParser";
const { s, int, path } = UrlParser;

export type Model = {
  pokemon: RemoteData<Pokemon>;
  backToListUrl: string;
};

export type Msg = Tagged<"gotPokemon", { pokemon: Pokemon }>;
const Msg = Constructors<Msg>();

/** matches the route `/pokemon/{int}` */
const parser = path(s("pokemon"), int);

export const { init, parseUrl, update }: ModelUpdate<Model, Msg> = {
  init: () => [
    { pokemon: RemoteData.notStarted, backToListUrl: "/pokemon/" },
    Cmd.none,
  ],
  update: ({ backToListUrl }: Model, msg: Msg) =>
    match.tagged(msg).on({
      gotPokemon: ({ pokemon }) => [
        { backToListUrl, pokemon: RemoteData.succeeded(pokemon) },
        Cmd.none,
      ],
    }),
  parseUrl: ({ backToListUrl }) =>
    UrlParser.map(parser)((pokemonId) => {
      const [cmd, cachedData] = pokemonService.getById(pokemonId, (pokemon) =>
        Msg("gotPokemon")({ pokemon })
      );

      return [{ pokemon: RemoteData.mapCache(cachedData), backToListUrl }, cmd];
    }),
};
