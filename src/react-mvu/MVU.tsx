import { FC, useEffect, useRef } from "react";
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

const initialized = {
  value: false,
};

export default function Mvu<Model extends object, Msg>({
  View,
  init,
  update,
  parseUrl,
  enableDevTools = false,
}: MVUProps<Model, Msg>): JSX.Element {
  const initializedRef = useRef(initialized);

  useEffect(() => {
    if (initializedRef.current.value) return;
    initializedRef.current.value = true;

    // set up routing override
    // TODO: switch to the broswer navigation API when it is available
    document.addEventListener("click", overrideRouting);
  }, []);

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
      <View model={model} dispatch={dispatch} />

      {enableDevTools && (
        <DevToolsInternal currentModel={model} modelHistory={modelHistory} />
      )}
    </>
  );
}

function overrideRouting(ev: MouseEvent) {
  const target = ev.target as HTMLElement;
  if (target.tagName !== "A") return;

  const link = target as HTMLAnchorElement;

  const newUrl = new URL(link.href);

  // if we are linking externally, then allow default behavior
  if (newUrl.origin !== document.location.origin) return;

  // otherwise override internal routes with history api
  // to keep the current page loaded, and do all routing
  // in a SPA style.

  const routesAreSame =
    newUrl.pathname === document.location.pathname &&
    newUrl.search === document.location.search &&
    newUrl.hash === document.location.hash;

  console.log(newUrl.pathname);

  if (!routesAreSame) {
    history.pushState({}, "", newUrl);
  }

  ev.preventDefault();
  ev.stopPropagation();
}
