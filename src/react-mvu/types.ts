import { FC } from "react";
import { Cmd } from "./Cmd";
import { Parser } from "./Parser";

export type ModelUpdate<Model, Msg> = {
  init: () => readonly [Model, Cmd<Msg>];
  update: (model: Model, msg: Msg) => readonly [Model, Cmd<Msg>];
  parseUrl: (model: Model) => Parser<readonly [Model, Cmd<Msg>]>;
};

export type ViewFC<Model, Msg> = FC<ViewProps<Model, Msg>>;

export type ViewProps<Model, Msg> = {
  model: Model;
  dispatch: (msg: Msg) => void;
};
