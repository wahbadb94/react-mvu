import { ViewProps } from "../react-mvu/types";
import { Model, Msg } from "./ModelUpdate";
import * as PokemonPage from "../pages/Pokemon";
import * as PokemonDetails from "../pages/PokemonDetails";
import * as HomePage from "../pages/Home";
import { unreachable } from "../utilities/matcher";

export function View({ dispatch, model }: ViewProps<Model, Msg>): JSX.Element {
  return (
    <div className="h-screen flex flex-col bg-gray-200">
      {/* Main Nav */}
      <nav className="bg-emerald-600 text-white shadow-md">
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
      <main className="grow flex flex-row justify-center">
        <div className="h-full w-full max-w-7xl">
          <RenderActivePage dispatch={dispatch} model={model} />
        </div>
      </main>
    </div>
  );
}

function RenderActivePage({
  model: { activePage },
  dispatch,
}: ViewProps<Model, Msg>): JSX.Element {
  switch (activePage.tag) {
    case "home":
      return <HomePage.View model={activePage} />;
    case "pokemon":
      return (
        <PokemonPage.View
          model={activePage}
          dispatch={(msg) => dispatch({ tag: "pokemon", msg })}
        />
      );
    case "pokemonDetails":
      return (
        <PokemonDetails.View
          model={activePage}
          dispatch={(msg) => dispatch({ tag: "pokemonDetails", msg })}
        />
      );
    case "loading":
      return <>loading...</>;
    case "notFound":
      return <>not found.</>;
    default:
      return unreachable(activePage);
  }
}

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Pokemon", path: "/pokemon" },
] as const;
