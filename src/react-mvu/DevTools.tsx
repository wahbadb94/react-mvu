import JsonView from "@uiw/react-json-view";
import { useState } from "react";
//import JsonView from "@uiw/react-json-view";

type DevToolsInternalProps<T extends object> = {
  currentModel: T;
  modelHistory: T[];
};

// TODO: time traveling debugger

export default function DevToolsInternal<T extends object>({
  currentModel: _,
  modelHistory: history,
}: DevToolsInternalProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [show, setShow] = useState(false);

  const OpenCloseButton = (
    <button
      className="absolute bottom-2 right-2 p-2 rounded-md border-2 border-slate-700 bg-slate-500 text-purple-50 font-semibold"
      onClick={() => setShow((prev) => !prev)}
    >
      DevTools
    </button>
  );

  return (
    <>
      {OpenCloseButton}

      {show && (
        <div className="absolute bg-black/20 inset-0">
          <div className="absolute bg-white shadow-md left-1/2 translate-x-[-50%] top-1/2 translate-y-[-50%] rounded-md border border-gray-400 h-2/3 w-[90%]">
            <div className="flex flex-row h-full rounded-md flex-nowrap">
              {/* Side Bar */}
              <ol className="bg-slate-200 border rounded-md border-r-gray-400 overflow-y-auto overflow-x-hidden">
                {history.map((_, index) => (
                  <li
                    key={index}
                    className="hover:bg-slate-300 px-8 py-4 cursor-pointer relative right-[-1px] border-r-gray-400 data-[active=true]:border-r-transparent data-[active=true]:bg-white data-[active=true]:hover:bg-slate-50 border border-transparent border-b-gray-400"
                    onClick={() => setActiveIndex(index)}
                    data-active={activeIndex === index}
                  >
                    {index}
                  </li>
                ))}
              </ol>

              {/* Main View */}
              <div className="p-4 grow overflow-auto">
                <div className="shadow-inner overflow-auto bg-slate-50 p-4 h-full rounded-md border border-gray-200">
                  <JsonView value={history[activeIndex]} collapsed={4} />
                </div>
              </div>
            </div>
          </div>

          {OpenCloseButton}
        </div>
      )}
    </>
  );
}
