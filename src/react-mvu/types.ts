import { FC } from "react";
import { Cmd } from "./Cmd";

export type ModelUpdate<Model, Msg> = {
  init: () => readonly [Model, Cmd<Msg>];
  update: (model: Model, msg: Msg) => readonly [Model, Cmd<Msg>];
};

export type ViewFC<Model, Msg> = FC<ViewProps<Model, Msg>>;

export type ViewProps<Model, Msg> = {
  model: Model;
  dispatch: (msg: Msg) => void;
};

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type EmptyObject<T extends Record<string, unknown>> = T extends Record<
  string,
  never
>
  ? "true"
  : "false";
