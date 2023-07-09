import { PokemonResource } from "./Pokemon";

export type Ability = {
  id: number;
  name: string;
  pokemon: AbilityPokemon[];
};

export type AbilityResource = {
  name: string;
  url: string;
};

export type AbilityPokemon = {
  is_hidden: boolean;
  pokemon: PokemonResource;
  slot: number;
};
