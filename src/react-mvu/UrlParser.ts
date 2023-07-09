import { Cmd } from "./Cmd";
import { Parser } from "./Parser";

export type UrlParser<Model, Msg> = Parser<readonly [Model, Cmd<Msg>]>;

export const UrlParser = {
  map:
    <ModelA, ModelB, MsgA, MsgB>(
      fModel: (a: ModelA) => ModelB,
      fCmd: (a: Cmd<MsgA>) => Cmd<MsgB>
    ) =>
    (parser: UrlParser<ModelA, MsgA>) =>
      Parser.map(
        ([modelA, cmdA]) => [fModel(modelA), fCmd(cmdA)] as const,
        parser
      ),
};
