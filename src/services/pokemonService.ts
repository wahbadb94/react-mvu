import { Http } from "../HttpClient";
import constants from "../constants";
import { Pokemon, PokemonResource } from "../models/Pokemon";

const baseUrl = `${constants.pokeApiUrl}/pokemon` as const;

function getByName<Msg>(name: string, andThen: (pokemon: Pokemon) => Msg) {
  return Http.get(`${baseUrl}/${name}`, andThen);
}

function getById<Msg>(id: number, andThen: (pokemon: Pokemon) => Msg) {
  return Http.get(`${baseUrl}/${id}`, andThen);
}

export type GetListParams = {
  offset: number;
  limit: number;
};

export type FetchPokemonResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonResource[];
};

function getList<Msg>(
  { limit, offset }: GetListParams,
  andThen: (response: FetchPokemonResponse) => Msg
) {
  return Http.get(`${baseUrl}?offset=${offset}&limit=${limit}`, andThen);
}

export default {
  getByName,
  getById,
  getList,
};
