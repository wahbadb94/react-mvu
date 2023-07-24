import { ViewProps } from "../react-mvu/types";
import { Model, Msg } from "./ModelUpdate";
import * as PokemonPage from "../pages/Pokemon";
import * as PokemonDetails from "../pages/PokemonDetails";
import * as HomePage from "../pages/Home";
import match, { unreachable } from "../utilities/matcher";

export function View({ dispatch, model }: ViewProps<Model, Msg>): JSX.Element {
  const displayShadow = match.tagged(model.page).on({
    home: () => true,
    loading: () => true,
    notFound: () => true,
    pokeDetails: () => true,
    pokemon: () => false,
  });
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Main Nav */}
      <nav className="bg-emerald-600 text-white shadow-md z-10">
        <ul className="flex flex-row justify-end">
          {navLinks.map((link) => (
            <a
              key={link.label}
              className="cursor-pointer p-4 hover:bg-emerald-700 font-bold transition-colors"
              href={link.path}
            >
              {link.label}
            </a>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <main className="grow flex flex-row justify-center overflow-hidden">
        <div
          className="h-full w-full max-w-7xl overflow-hidden data-[shadow=true]:shadow-sm"
          data-shadow={displayShadow}
        >
          <RenderActivePage dispatch={dispatch} model={model} />
        </div>
      </main>
    </div>
  );
}

function RenderActivePage({
  model: { page },
  dispatch,
}: ViewProps<Model, Msg>): JSX.Element {
  switch (page.tag) {
    case "home":
      return <HomePage.View model={page} />;
    case "pokemon":
      return (
        <PokemonPage.View
          model={page}
          dispatch={(msg) => dispatch(Msg("pokemon")({ msg }))}
        />
      );
    case "pokeDetails":
      return (
        <PokemonDetails.View
          model={page}
          dispatch={(msg) => dispatch(Msg("pokeDetails")({ msg }))}
        />
      );
    case "loading":
      return <>loading...</>;
    case "notFound":
      return <>not found.</>;
    default:
      return unreachable(page);
  }
}

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Pokemon", path: "/pokemon" },
] as const;
