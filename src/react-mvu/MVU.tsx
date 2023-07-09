import { FC, useCallback, useEffect, useRef } from "react";
import { ModelUpdate, ViewProps } from "./types";
import { Cmd } from "./Cmd";
import { create } from "zustand";
import match from "../utilities/matcher";
import { Parser } from "./Parser";
import DevToolsInternal from "./DevTools";

export type MVUProps<Model extends object, Msg> = {
  View: FC<ViewProps<Model, Msg>>;
  enableDevTools?: boolean;
} & ModelUpdate<Model, Msg>;

type MvuState<Model extends object, Msg> = {
  model: Model;
  modelHistory: Model[];
  commmandQueue: Cmd<Msg>[];
  dispatch: (msg: Msg) => void;
  processCmdQueue: () => void;
  handlePathChange: (location: Location) => void;
};

export default function Mvu<Model extends object, Msg>({
  View,
  init,
  update,
  parseUrl,
  enableDevTools = false,
}: MVUProps<Model, Msg>): JSX.Element {
  const useMvuStoreRef = useRef(
    create<MvuState<Model, Msg>>((set, get) => {
      const [initModel, initCmd] = init();

      // helper for processing commands
      function processCmd(cmd: Cmd<Msg>) {
        const { dispatch } = get();
        return match.tagged(cmd()).on<void>({
          none: () => undefined,
          msg: ({ msg }) => dispatch(msg),
          promise: ({ promise }) => {
            promise.then(dispatch);
          },
          batch: ({ cmds: batch }) => batch.forEach(processCmd),
        });
      }

      // return the store
      return {
        model: initModel,
        modelHistory: [initModel],
        commmandQueue: [initCmd],
        dispatch: (msg) =>
          set((prev) => {
            const [newModel, cmd] = update(prev.model, msg);
            return {
              commmandQueue: [...prev.commmandQueue, cmd],
              model: newModel,
              modelHistory: [...prev.modelHistory, newModel],
            };
          }),
        processCmdQueue: () => {
          const commandQueue = get().commmandQueue;
          if (commandQueue.length === 0) return;

          commandQueue.forEach(processCmd);
          set({ commmandQueue: [] });
        },
        handlePathChange: (location) =>
          set((prev) => {
            const result = Parser.run(
              parseUrl(prev.model),
              location.pathname + location.search
            );
            if (result.tag === "fail") return {};

            const [newModel, cmd] = result.parsed;
            return {
              model: newModel,
              modelHistory: [...prev.modelHistory, newModel],
              commmandQueue: [...prev.commmandQueue, cmd],
            };
          }),
      };
    })
  );

  const model = useMvuStoreRef.current((store) => store.model);
  const modelHistory = useMvuStoreRef.current((store) => store.modelHistory);
  const commandQueue = useMvuStoreRef.current((store) => store.commmandQueue);
  const dispatch = useMvuStoreRef.current((store) => store.dispatch);
  const handlePathChange = useMvuStoreRef.current(
    (store) => store.handlePathChange
  );
  const processCmdQueue = useMvuStoreRef.current(
    (store) => store.processCmdQueue
  );

  // TODO: switch to the broswer navigation API when it is available
  const navigate = useCallback((path: string, search?: URLSearchParams) => {
    const queryString = search?.toString() ?? null;
    const href = path + (queryString ? `?${queryString}` : "");
    window.history.pushState({}, "", href);
  }, []);

  // process command queue when it changes
  useEffect(() => processCmdQueue(), [commandQueue, processCmdQueue]);

  // poll url changes every 100ms
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    let handle: NodeJS.Timeout | null = null;
    (function pollUrlChange() {
      if (window.location.href !== prevUrlRef.current) {
        handlePathChange(window.location);
        prevUrlRef.current = window.location.href;
      }
      handle = setTimeout(pollUrlChange, 100);
    })();

    return () => (handle !== null ? clearTimeout(handle) : undefined);
  }, [handlePathChange]);

  return (
    <>
      <View model={model} dispatch={dispatch} navigate={navigate} />

      {enableDevTools && (
        <DevToolsInternal currentModel={model} modelHistory={modelHistory} />
      )}
    </>
  );
}
