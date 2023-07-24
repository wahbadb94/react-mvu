import {
  FC,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { ViewProps } from "./types";
import { Cmd } from "./Cmd";
import match from "../utilities/matcher";
import DevToolsInternal from "./DevTools";
import { UrlRequest } from "../react-mvu/UrlRequest";

const initialized = {
  value: false,
};

export function Mvu<Model extends Record<string, unknown>, Msg>({
  View,
  init,
  onPathChange,
  onUrlRequest,
  update,
  enableDevTools,
}: MVUProps<Model, Msg>): JSX.Element {
  const prevUrlRef = useRef(window.location.href);

  const commandQueueRef = useRef([] as Cmd<Msg>[]);

  const { get, set, subscribe } = useMvuState(init);

  const useStore = useCallback(
    function useStore() {
      return useSyncExternalStore(subscribe, get);
    },
    [get, subscribe]
  );

  const dispatch = useCallback(
    (msg: Msg) => {
      const { model, modelHistory } = get();
      const [newModel, newCmd] = update(model, msg);
      set({
        model: newModel,
        modelHistory:
          newModel === model ? modelHistory : [...modelHistory, newModel],
      });

      commandQueueRef.current.push(newCmd);
    },
    [get, set, update]
  );

  // poll for command queue changes every 100ms
  useEffect(() => {
    let handle: NodeJS.Timeout | null = null;

    function processCmd(cmd: Cmd<Msg>) {
      match.tagged(cmd()).on<void>({
        none: () => undefined,
        msg: ({ msg }) => dispatch(msg),
        promise: ({ promise }) => {
          promise.then(dispatch);
        },
        nav: ({ type }) =>
          match.tagged(type).on<void>({
            load: ({ href }) => (window.location.href = href),
            push: ({ url }) => history.pushState({}, "", url),
          }),
        batch: ({ cmds }) => cmds.forEach(processCmd),
      });
    }

    (function pollCmdQueueChange() {
      let nextCmd = commandQueueRef.current.shift();
      while (nextCmd) {
        processCmd(nextCmd);
        nextCmd = commandQueueRef.current.shift();
      }

      handle = setTimeout(pollCmdQueueChange, 100);
    })();

    return () => (handle !== null ? clearTimeout(handle) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // poll url changes every 100ms
  useEffect(() => {
    let handle: NodeJS.Timeout | null = null;
    (function pollUrlChange() {
      if (window.location.href !== prevUrlRef.current) {
        prevUrlRef.current = window.location.href;
        dispatch(onPathChange(getCurrentPath()));
      }
      handle = setTimeout(pollUrlChange, 100);
    })();

    return () => (handle !== null ? clearTimeout(handle) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overrideRouting = useCallback(
    (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (target.tagName !== "A") return;

      const link = target as HTMLAnchorElement;

      ev.preventDefault();
      ev.stopPropagation();

      const newUrl = new URL(link.href);

      if (newUrl.origin !== document.location.origin) {
        dispatch(onUrlRequest(UrlRequest("external")({ href: newUrl.href })));
        return;
      }
      // otherwise override internal routes with history api
      // to keep the current page loaded, and do all routing
      // in a SPA style.
      else {
        const routesAreSame =
          newUrl.pathname === document.location.pathname &&
          newUrl.search === document.location.search &&
          newUrl.hash === document.location.hash;

        if (!routesAreSame) {
          dispatch(onUrlRequest(UrlRequest("internal")({ url: newUrl })));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // set up routing override
  const initializedRef = useRef(initialized);
  useEffect(() => {
    if (initializedRef.current.value) return;
    initializedRef.current.value = true;

    // TODO: switch to the broswer navigation API when it is available
    document.addEventListener("click", overrideRouting);
  }, [overrideRouting]);

  return (
    <MvuInner
      dispatch={dispatch}
      useStore={useStore}
      View={View}
      enableDevTools={enableDevTools}
    />
  );
}

type MvuInnerProps<Model extends Record<string, unknown>, Msg> = {
  useStore: () => MvuState<Model>;
} & Pick<MVUProps<Model, Msg>, "View" | "enableDevTools"> &
  Pick<ViewProps<Model, Msg>, "dispatch">;

function MvuInner<Model extends Record<string, unknown>, Msg>({
  View,
  useStore,
  enableDevTools,
  dispatch,
}: MvuInnerProps<Model, Msg>): JSX.Element {
  const store = useStore();

  return (
    <>
      <View model={store.model} dispatch={dispatch} />

      {enableDevTools && (
        <DevToolsInternal
          currentModel={store.model}
          modelHistory={store.modelHistory}
        />
      )}
    </>
  );
}
/* ----------------------------------------------------------------------------
 *
 * ------------------------------ Helpers -------------------------------------
 *
 * ------------------------------------------------------------------------- */

function getCurrentPath() {
  return window.location.pathname + window.location.search;
}

function useMvuState<Model extends Record<string, unknown>, Msg>(
  init: MVUProps<Model, Msg>["init"]
): {
  get: () => MvuState<Model>;
  set: (value: Partial<MvuState<Model>>) => void;
  subscribe: (callback: () => void) => () => void;
} {
  const initReturnRef = useRef<readonly [Model, Cmd<Msg>]>(
    init(getCurrentPath()) // we need to be careful that this is only ever evaluated once
  );

  const storeRef = useRef<MvuState<Model>>({
    model: initReturnRef.current[0],
    modelHistory: [initReturnRef.current[0]],
  });

  const get = useCallback(() => storeRef.current, []);

  const subscriptions = useRef(new Set<() => void>());
  const subscribe = useCallback((callback: () => void) => {
    subscriptions.current.add(callback);
    return () => subscriptions.current.delete(callback);
  }, []);

  const set = useCallback((value: Partial<MvuState<Model>>) => {
    storeRef.current = { ...storeRef.current, ...value };
    subscriptions.current.forEach((subscription) => subscription());
  }, []);

  return {
    get,
    set,
    subscribe,
  };
}

/* ----------------------------------------------------------------------------
 *
 * -------------------------------- Types -------------------------------------
 *
 * ------------------------------------------------------------------------- */

export type MVUProps<Model extends Record<string, unknown>, Msg> = {
  init: (path: string) => readonly [Model, Cmd<Msg>];
  update: (model: Model, msg: Msg) => readonly [Model, Cmd<Msg>];
  View: FC<ViewProps<Model, Msg>>;
  onUrlRequest: (urlRequest: UrlRequest) => Msg;
  onPathChange: (path: string) => Msg;
  enableDevTools?: boolean;
};

type MvuState<Model extends Record<string, unknown>> = {
  model: Model;
  modelHistory: Model[];
};
