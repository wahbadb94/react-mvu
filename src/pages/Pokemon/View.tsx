import { ViewProps } from "../../react-mvu/types";
import RenderRemoteData from "../../react-mvu/RenderRemoteData";
import { Model, Msg } from "./ModelUpdate";

export function View({
  model: { pokemonListResponse, offset, limit },
  navigate,
}: ViewProps<Model, Msg>): JSX.Element {
  return (
    <RenderRemoteData
      remoteData={pokemonListResponse}
      render={({ next, previous, results, count }) => {
        const nextSearch =
          next?.indexOf("?") ?? -1 > -1
            ? next?.substring(next.indexOf("?")) ?? null
            : null;

        const prevSearch =
          previous?.indexOf("?") ?? -1 > -1
            ? previous?.substring(previous.indexOf("?")) ?? null
            : null;

        return (
          <div>
            <ul className="p-4">
              {results.map((p) => {
                const id = Number(p.url.split("/").at(-2));
                return (
                  <li
                    key={p.name}
                    className="odd:bg-gray-100 even:bg-gray-200 p-2 cursor-pointer"
                  >
                    <span className="text-gray-700">{id}.</span>{" "}
                    <span
                      className="inline-block px-2 hover:underline"
                      onClick={() => navigate(`/pokemon/${id}`)}
                    >
                      {p.name}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-row justify-between items-center">
              <div className="px-4 text-gray-600 text-sm">
                Showing {offset + 1} to {offset + limit} of {count}
              </div>

              <div className="flex justify-between flex-row gap-2">
                {prevSearch && (
                  <button
                    className="border rounded border-gray-400 py-1 px-2"
                    onClick={() => navigate(`/pokemon${prevSearch}`)}
                  >
                    Back
                  </button>
                )}
                {nextSearch && (
                  <button
                    className="border rounded border-gray-400 py-1 px-2"
                    onClick={() => navigate(`/pokemon${nextSearch}`)}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
