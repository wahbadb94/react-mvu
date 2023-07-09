import { RemoteData } from "../../react-mvu/RemoteData";
import { Cmd } from "../../react-mvu/Cmd";
import { Parser, int, opt, s, seq } from "../../react-mvu/Parser";
import { Pokemon } from "../../models/Pokemon";
import pokemonService from "../../services/pokemonService";
import match, { Tagged, Constructors } from "../../utilities/matcher";
import { ModelUpdate } from "../../react-mvu/types";

export type Model = {
  pokemon: RemoteData<Pokemon>;
  backToListUrl: string;
};

export type Msg = Tagged<"gotPokemon", { pokemon: Pokemon }>;
const Msg = Constructors<Msg>();

/** matches the route `/pokemon/{int}/` */
const parser = seq(s("/pokemon/"), int, opt(s("/")));

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
    Parser.map(([, pokemonId]) => {
      const [cmd, cachedData] = pokemonService.getById(pokemonId, (pokemon) =>
        Msg("gotPokemon")({ pokemon })
      );

      return [{ pokemon: RemoteData.mapCache(cachedData), backToListUrl }, cmd];
    }, parser),
};
