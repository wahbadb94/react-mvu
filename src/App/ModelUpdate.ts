import match, { Tagged, Constructors } from "../utilities/matcher";
import { UrlParser } from "../react-mvu/UrlParser2";
const { oneOf } = UrlParser;
import * as HomePage from "../pages/Home";
import * as PokemonDetailsPage from "../pages/PokemonDetails";
import * as PokemonPage from "../pages/Pokemon";
import { Cmd } from "../react-mvu/Cmd";
import { ModelUpdate } from "../react-mvu/types";

export type Model = {
  activePage: Page;
};

type Page =
  | Tagged<"home", HomePage.Model>
  | Tagged<"pokemon", PokemonPage.Model>
  | Tagged<"pokemonDetails", PokemonDetailsPage.Model>
  | Tagged<"loading">
  | Tagged<"notFound">;

const Page = Constructors<Page>();

export type Msg =
  | Tagged<"home", { msg: HomePage.Msg }>
  | Tagged<"pokemon", { msg: PokemonPage.Msg }>
  | Tagged<"pokemonDetails", { msg: PokemonDetailsPage.Msg }>;

const Msg = Constructors<Msg>();

export const { init, parseUrl, update }: ModelUpdate<Model, Msg> = {
  init: () => [{ activePage: Page("loading")({}) }, Cmd.none],
  update: (model: Model, msg: Msg) =>
    match.tagged(msg).on<[Model, Cmd<Msg>]>({
      home: ({ msg }) => {
        if (model.activePage.tag !== "home") return [model, Cmd.none];

        const [homeModel, homeCmd] = HomePage.update(model.activePage, msg);

        return [
          { activePage: Page("home")(homeModel) },
          Cmd.map(homeCmd)((msg) => Msg("home")({ msg })),
        ];
      },
      pokemon: ({ msg }) => {
        if (model.activePage.tag !== "pokemon") return [model, Cmd.none];

        const [pokemonModel, pokemonCmd] = PokemonPage.update(
          model.activePage,
          msg
        );

        return [
          { activePage: Page("pokemon")(pokemonModel) },
          Cmd.map(pokemonCmd)((msg) => Msg("pokemon")({ msg })),
        ];
      },
      pokemonDetails: ({ msg }) => {
        if (model.activePage.tag !== "pokemonDetails") return [model, Cmd.none];

        const [pokeDetailsModel, pokeDetailsCmd] = PokemonDetailsPage.update(
          model.activePage,
          msg
        );

        return [
          { activePage: Page("pokemonDetails")(pokeDetailsModel) },
          Cmd.map(pokeDetailsCmd)((msg) => Msg("pokemonDetails")({ msg })),
        ];
      },
    }),
  parseUrl: ({ activePage }) =>
    UrlParser.map(
      oneOf(
        // home
        UrlParser.map(
          HomePage.parseUrl(
            activePage.tag === "home" ? activePage : HomePage.init()[0]
          )
        )(([homeModel, cmd]) => [
          Page("home")(homeModel),
          Cmd.map(cmd)((msg) => Msg("home")({ msg })),
        ]),
        // pokemon
        UrlParser.map(
          PokemonPage.parseUrl(
            activePage.tag === "pokemon" ? activePage : PokemonPage.init()[0]
          )
        )(([pokemonModel, cmd]) => [
          Page("pokemon")(pokemonModel),
          Cmd.map(cmd)((msg) => Msg("pokemon")({ msg })),
        ]),
        // pokemonDetails
        UrlParser.map(
          PokemonDetailsPage.parseUrl({
            ...(activePage.tag === "pokemonDetails"
              ? activePage
              : PokemonDetailsPage.init()[0]),
            backToListUrl: match.tagged(activePage).on({
              home: () => "/pokemon",
              loading: () => "/pokemon",
              notFound: () => "/pokemon",
              pokemon: ({ limit, offset }) =>
                "/pokemon?" +
                new URLSearchParams({
                  limit: limit.toString(),
                  offset: offset.toString(),
                }).toString(),
              pokemonDetails: ({ backToListUrl }) => backToListUrl,
            }),
          })
        )(([pokeDetailsModel, cmd]) => [
          Page("pokemonDetails")(pokeDetailsModel),
          Cmd.map(cmd)((msg) => Msg("pokemonDetails")({ msg })),
        ])
      )
    )(([page, cmd]) => [{ activePage: page }, cmd]),
};
