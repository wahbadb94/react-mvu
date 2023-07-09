import { AbilityResource } from "./Ability";

export type Pokemon = {
  abilities: PokemonAbility[];
  base_experience: number;
  height: number;
  id: number;
  is_default: true;
  name: string;
  order: number;
  weight: number;
  sprites: Sprites;
  types: PokemonTypeSlot[];
};

export type PokemonResource = {
  name: string;
  url: string;
};

export type Sprites = {
  back_default: string;
  front_default: string;
};

export type PokemonAbility = {
  ability: AbilityResource;
  is_hidden: boolean;
  slot: number;
};

export type PokemonTypeSlot = {
  slot: 1 | 2;
  type: TypeReference;
};

export type TypeReference = {
  name: PokemonType;
  url: string;
};

export const PokemonTypes = [
  "water",
  "grass",
  "fire",
  "ground",
  "rock",
  "fighting",
  "normal",
  "psychic",
  "electric",
  "ghost",
  "dark",
  "dragon",
  "fairy",
  "steel",
  "flying",
  "poison",
  "ice",
  "bug",
] as const;

export type PokemonType = (typeof PokemonTypes)[number];
