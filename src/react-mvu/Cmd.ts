import match, { Tagged } from "../utilities/matcher";

export type Cmd<Msg> = () => CmdReturn<Msg>;
type CmdReturn<Msg> =
  | Tagged<"msg", { msg: Msg }>
  | Tagged<"promise", { promise: Promise<Msg> }>
  | Tagged<"none">
  | Tagged<"batch", { cmds: Cmd<Msg>[] }>;

function ofPromise<R, Msg>(
  execute: () => Promise<R>,
  andThen: (data: R) => Msg
): Cmd<Msg> {
  return () => ({
    tag: "promise",
    promise: execute().then(andThen),
  });
}

function ofMsg<Msg>(msg: Msg): Cmd<Msg> {
  return () => ({ tag: "msg", msg });
}

function none(): Tagged<"none"> {
  return { tag: "none" };
}

function batch<Msg>(...cmds: Cmd<Msg>[]): Cmd<Msg> {
  return () => ({ tag: "batch", cmds });
}

const map =
  <A>(cmd: Cmd<A>) =>
  <B>(f: (msg: A) => B): Cmd<B> =>
    match.tagged(cmd()).on<Cmd<B>>({
      promise: ({ promise }) => ofPromise(() => promise, f),
      batch: ({ cmds }) => batch(...cmds.map((c) => map(c)(f))),
      msg: ({ msg }) => ofMsg(f(msg)),
      none: () => none,
    });

export const Cmd = {
  ofPromise,
  ofMsg,
  none,
  batch,
  map,
};
