import { Cmd } from "../../react-mvu/Cmd";
import match, { Tagged } from "../../utilities/matcher";

export type Model = {
  welcomeMsg: string;
};

export type Msg = Tagged<"noop">;

const initModel: Model = { welcomeMsg: "hi there, welcome" };

export const init = (): [Model, Cmd<Msg>] => [initModel, Cmd.none];

export const update = (model: Model, msg: Msg): [Model, Cmd<Msg>] =>
  match.tagged(msg).on({
    noop: () => [model, Cmd.none],
  });
