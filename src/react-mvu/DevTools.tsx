import JsonView from "@uiw/react-json-view";
import { MvuStore, StoreDispatch } from "./MVU";

export type DevToolsInternalProps<
  Model extends Record<string, unknown>,
  Msg
> = {
  store: MvuStore<Model>;
  storeDispatch: StoreDispatch<Msg>;
};

export default function DevToolsInternal<
  Model extends Record<string, unknown>,
  Msg
>({
  store: { devToolsVisible, modelHistory, modelIndex, modelState },
  storeDispatch,
}: DevToolsInternalProps<Model, Msg>) {
  const timeTraveling = modelState.tag === "timeTravel";

  const OpenCloseButton = (
    <div className="absolute bottom-2 right-2 p-2 flex flex-row gap-4">
      {timeTraveling && (
        <div className="flex flex-row items-center gap-2">
          <button
            className="border disabled:opacity-50 border-black rounded-full px-2.5 py-1 bg-rose-400"
            onClick={() =>
              storeDispatch({
                tag: "setTimeTraveling",
                timeTraveling: false,
              })
            }
          >
            <i className="fas fa-xmark"></i>
          </button>
          <button
            className="border disabled:opacity-50 border-black rounded-full px-3 py-1 bg-white"
            disabled={modelIndex === 0}
            onClick={() =>
              storeDispatch({
                tag: "setModelIndex",
                modelIndex: modelIndex - 1,
              })
            }
          >
            <i className="fas fa-caret-left"></i>
          </button>
          <button
            className="border disabled:opacity-50 bg-white border-black rounded-full px-3 py-1"
            disabled={modelIndex === modelHistory.length - 1}
            onClick={() =>
              storeDispatch({
                tag: "setModelIndex",
                modelIndex: modelIndex + 1,
              })
            }
          >
            <i className="fas fa-caret-right"></i>
          </button>
        </div>
      )}

      <button
        className="p-2 rounded-md border-2 border-slate-700 bg-slate-500 text-purple-50 font-semibold"
        onClick={() =>
          storeDispatch({
            tag: "setDevToolsVisible",
            devToolsVisible: !devToolsVisible,
          })
        }
      >
        DevTools
      </button>
    </div>
  );

  return (
    <>
      {!devToolsVisible && OpenCloseButton}

      {devToolsVisible && (
        <div className="absolute bg-black/20 inset-0">
          <div className="absolute bg-white shadow-md left-1/2 translate-x-[-50%] top-1/2 translate-y-[-50%] rounded-md border border-gray-400 h-2/3 w-[90%]">
            <div className="flex flex-row h-full rounded-md flex-nowrap">
              {/* Side Bar */}
              <ol className="bg-slate-200 border rounded-md border-r-gray-400 overflow-y-auto overflow-x-hidden">
                {modelHistory.map((_, index) => (
                  <li
                    key={index}
                    className="hover:bg-slate-300 flex-1 px-4 text-center md:px-6 py-2 md:py-4 cursor-pointer relative right-[-1px] border-r-gray-400 data-[active=true]:border-r-transparent data-[active=true]:bg-white data-[active=true]:hover:bg-slate-50 border border-transparent border-b-gray-400"
                    onClick={() =>
                      storeDispatch({ tag: "setModelIndex", modelIndex: index })
                    }
                    data-active={index === modelIndex}
                  >
                    {index}
                  </li>
                ))}
              </ol>

              {/* Main View */}
              <div className="p-4 flex-1 overflow-auto flex flex-col">
                <div className="mb-2">
                  <input
                    type="checkbox"
                    id="time-travel-checkbox"
                    checked={timeTraveling}
                    onChange={() =>
                      storeDispatch({
                        tag: "setTimeTraveling",
                        timeTraveling: !timeTraveling,
                      })
                    }
                  />{" "}
                  <label htmlFor="time-travel-checkbox">Time Travel?</label>
                </div>
                <div className="shadow-inner overflow-auto bg-slate-50 grow p-4 rounded-md border border-gray-200">
                  <JsonView value={modelHistory[modelIndex]} collapsed={4} />
                </div>
              </div>
            </div>
          </div>

          {OpenCloseButton}
        </div>
      )}

      {timeTraveling && !devToolsVisible && <TimeTravelingIndicator />}
    </>
  );
}

function TimeTravelingIndicator() {
  return (
    <i className="fas fa-triangle-exclamation text-amber-500 fa-beat  absolute bottom-5 left-4 text-2xl"></i>
  );
}
