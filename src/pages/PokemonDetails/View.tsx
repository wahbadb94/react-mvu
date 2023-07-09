import { ViewProps } from "../../react-mvu/types";
import { Pokemon, PokemonType } from "../../models/Pokemon";
import RenderRemoteData from "../../react-mvu/RenderRemoteData";
import { Model, Msg } from "./ModelUpdate";
import match from "../../utilities/matcher";

export function View({
  model: { pokemon, backToListUrl },
  navigate,
}: ViewProps<Model, Msg>): JSX.Element {
  return (
    <RenderRemoteData
      remoteData={pokemon}
      render={(p) => (
        <RenderPokemonDetails
          pokemon={p}
          backToListUrl={backToListUrl}
          navigate={navigate}
        />
      )}
    />
  );
}

function RenderPokemonDetails({
  pokemon: { name, sprites, types, id },
  backToListUrl,
  navigate,
}: {
  pokemon: Pokemon;
} & Pick<Model, "backToListUrl"> &
  Pick<ViewProps<Model, Msg>, "navigate">) {
  return (
    <div className={`p-8`}>
      <div
        className="hover:underline cursor-pointer text-sky-900 mb-2"
        onClick={() => navigate(backToListUrl)}
      >
        Back to List
      </div>
      <div
        className={`flex flex-row justify-between items-center py-4 px-8 border border-black rounded-md mb-4 ${getTypeClassNameSuble(
          types[0].type.name
        )}`}
      >
        <span
          className="hover:underline cursor-pointer"
          onClick={() => navigate(`/pokemon/${id - 1}`)}
        >
          prev
        </span>
        <h1 className={"text-4xl capitalize"}>
          #{id}: {name}
        </h1>

        <span
          className="hover:underline cursor-pointer"
          onClick={() => navigate(`/pokemon/${id + 1}`)}
        >
          next
        </span>
      </div>

      <div className="grid grid-cols-2">
        {/* Article Info */}
        <article>Some Other info about the pokemon.</article>

        {/* Sprites */}
        <div className={`rounded-md`}>
          <div
            className={`grid grid-cols-2 justify-evenly border border-black rounded-md rounded-b-none ${getTypeClassNameSuble(
              types[0].type.name
            )}`}
          >
            <img
              src={sprites.front_default}
              width={"100%"}
              style={{ imageRendering: "pixelated" }}
              alt={`${name} front sprite`}
            />
            <img
              src={sprites.back_default}
              width={"100%"}
              style={{ imageRendering: "pixelated" }}
              alt={`${name} back sprite`}
            />
          </div>

          <div className="flex flex-row justify-evenly">
            {types.map(({ slot, type }) => {
              const className = getTypeClassName(type.name);
              return (
                <div
                  key={slot}
                  className={
                    "capitalize border border-black grow text-center py-2 border-r-0 last:border-r border-t-0 font-bold first:rounded-bl-md last:rounded-br-md " +
                    className
                  }
                >
                  {type.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const getTypeClassName = (type: PokemonType) =>
  match.literal(type).on({
    bug: () => "bg-lime-700 text-white",
    dark: () => "bg-slate-700 text-white",
    dragon: () => "bg-violet-600 text-white",
    electric: () => "bg-yellow-400",
    fairy: () => "bg-red-300 brightness-[1.10]",
    fighting: () => "bg-rose-600 grayscale-[0.3] text-white",
    fire: () => "bg-orange-400",
    flying: () => "bg-violet-300 grayscale-[0.2]",
    ghost: () => "bg-indigo-600 grayscale-[0.5] text-white",
    grass: () => "bg-green-500",
    ground: () => "bg-yellow-600 grayscale-[0.5] text-white brightness-[1.15]",
    ice: () => "bg-teal-300 grayscale-[0.4]",
    normal: () => "bg-gray-300",
    poison: () => "bg-fuchsia-600 grayscale-[0.3] text-white",
    psychic: () => "bg-rose-500 text-white brightness-[1.25]",
    rock: () => "bg-yellow-700 grayscale-[0.5] text-white",
    steel: () => "bg-blue-200 grayscale-[0.5]",
    water: () => "bg-blue-500 text-white",
  });

const getTypeClassNameSuble = (type: PokemonType) =>
  match.literal(type).on({
    bug: () => "bg-lime-100",
    dark: () => "bg-slate-100",
    dragon: () => "bg-violet-100",
    electric: () => "bg-yellow-50",
    fairy: () => "bg-red-50",
    fighting: () => "bg-rose-100",
    fire: () => "bg-orange-50",
    flying: () => "bg-violet-300",
    ghost: () => "bg-indigo-100",
    grass: () => "bg-green-100",
    ground: () => "bg-yellow-100 grayscale-[0.5]",
    ice: () => "bg-teal-100 grayscale-[0.4]",
    normal: () => "bg-gray-100",
    poison: () => "bg-fuchsia-100 grayscale-[0.3]",
    psychic: () => "bg-rose-100",
    rock: () => "bg-yellow-100 grayscale-[0.5]",
    steel: () => "bg-blue-100 grayscale-[0.5]",
    water: () => "bg-blue-100",
  });
