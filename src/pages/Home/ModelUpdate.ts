import { Cmd } from "../../react-mvu/Cmd";
import { UrlParser } from "../../react-mvu/UrlParser2";
const { top, map } = UrlParser;
import { ModelUpdate } from "../../react-mvu/types";
import match, { Tagged } from "../../utilities/matcher";

export type Model = {
  welcomeMsg: string;
};

export type Msg = Tagged<"noop">;

const initModel: Model = { welcomeMsg: "hi there, welcome" };

export const { init, parseUrl, update }: ModelUpdate<Model, Msg> = {
  init: () => [initModel, Cmd.none],
  update: (model: Model, msg: Msg): [Model, Cmd<Msg>] =>
    match.tagged(msg).on({
      noop: () => [model, Cmd.none],
    }),
  parseUrl: () => map(top)(() => [initModel, Cmd.none]),
};
