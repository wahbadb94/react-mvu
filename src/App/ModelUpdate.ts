import match, { Tagged, Constructors } from "../utilities/matcher";
import * as HomePage from "../pages/Home";
import * as PokeDetailsPage from "../pages/PokemonDetails";
import * as PokemonPage from "../pages/Pokemon";
import { Cmd } from "../react-mvu/Cmd";
import { Route, getRoute } from "../Route";
import { UrlRequest } from "../react-mvu/UrlRequest";
import { Nav } from "../react-mvu/Nav";

/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Model / Msg ---------------------------------
 *
 * ------------------------------------------------------------------------- */

export type Model = {
  page: Page;
};

type Page =
  | Tagged<"home", HomePage.Model>
  | Tagged<"pokemon", PokemonPage.Model>
  | Tagged<"pokeDetails", PokeDetailsPage.Model>
  | Tagged<"loading">
  | Tagged<"notFound">;

const Page = Constructors<Page>();

export type Msg =
  | Tagged<"home", { msg: HomePage.Msg }>
  | Tagged<"pokemon", { msg: PokemonPage.Msg }>
  | Tagged<"pokeDetails", { msg: PokeDetailsPage.Msg }>
  | Tagged<"linkClicked", { urlRequest: UrlRequest }>
  | Tagged<"pathUpdated", { path: string }>;

export const Msg = Constructors<Msg>();

/* ----------------------------------------------------------------------------
 *
 * ---------------------------- Init / Update ---------------------------------
 *
 * ------------------------------------------------------------------------- */

export const init = (path: string) => initCurrentPage(getRoute(path), Cmd.none);

export const update = (model: Model, msg: Msg) =>
  match.tagged(msg).on<[Model, Cmd<Msg>]>({
    // navigation
    linkClicked: ({ urlRequest }) =>
      match.tagged(urlRequest).on({
        external: ({ href }) => [model, Nav.load(href)],
        internal: ({ url }) => [model, Nav.push(url)],
      }),

    pathUpdated: ({ path }) => initCurrentPage(getRoute(path), Cmd.none),

    // pages
    home: ({ msg }) => {
      if (model.page.tag !== "home") return [model, Cmd.none];

      const [homeModel, homeCmd] = HomePage.update(model.page, msg);
      return [
        { page: Page("home")(homeModel) },
        Cmd.map(homeCmd)((msg) => Msg("home")({ msg })),
      ];
    },

    pokemon: ({ msg }) => {
      if (model.page.tag !== "pokemon") return [model, Cmd.none];

      const [pokemonModel, pokemonCmd] = PokemonPage.update(model.page, msg);
      return [
        { page: Page("pokemon")(pokemonModel) },
        Cmd.map(pokemonCmd)((msg) => Msg("pokemon")({ msg })),
      ];
    },

    pokeDetails: ({ msg }) => {
      if (model.page.tag !== "pokeDetails") return [model, Cmd.none];

      const [pokeDetailsModel, pokeDetailsCmd] = PokeDetailsPage.update(
        model.page,
        msg
      );
      return [
        { page: Page("pokeDetails")(pokeDetailsModel) },
        Cmd.map(pokeDetailsCmd)((msg) => Msg("pokeDetails")({ msg })),
      ];
    },
  });

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Helpers ------------------------------------
 *
 * ------------------------------------------------------------------------- */

const initCurrentPage = (
  route: Route,
  existingCmd: Cmd<Msg>
): [Model, Cmd<Msg>] => {
  const [page, pageCmd] = match.tagged(route).on<[Page, Cmd<Msg>]>({
    notFound: () => [Page("notFound")({}), Cmd.none],

    home: () => {
      const [homeModel, homeCmd] = HomePage.init();
      return [
        Page("home")(homeModel),
        Cmd.map(homeCmd)((msg) => Msg("home")({ msg })),
      ];
    },

    pokemon: ({ limit, offset }) => {
      const [pokeModel, pokeCmd] = PokemonPage.init({ limit, offset });
      return [
        Page("pokemon")(pokeModel),
        Cmd.map(pokeCmd)((msg) => Msg("pokemon")({ msg })),
      ];
    },

    pokeDetails: ({ id }) => {
      const [pokeDetailsModel, pokeDetailsCmd] = PokeDetailsPage.init(id);
      return [
        Page("pokeDetails")(pokeDetailsModel),
        Cmd.map(pokeDetailsCmd)((msg) => Msg("pokeDetails")({ msg })),
      ];
    },
  });

  return [{ page }, Cmd.batch(existingCmd, pageCmd)];
};
