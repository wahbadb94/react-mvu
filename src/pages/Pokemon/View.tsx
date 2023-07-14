import { ViewProps } from "../../react-mvu/types";
import RenderRemoteData from "../../react-mvu/RenderRemoteData";
import { Model, Msg } from "./ModelUpdate";

export function View({
  model: { pokemonListResponse, offset, limit },
}: ViewProps<Model, Msg>): JSX.Element {
  return (
    <RenderRemoteData
      remoteData={pokemonListResponse}
      render={({ next, previous, results, count }, fetching) => {
        const nextSearch =
          next?.indexOf("?") ?? -1 > -1
            ? next?.substring(next.indexOf("?")) ?? null
            : null;

        const prevSearch =
          previous?.indexOf("?") ?? -1 > -1
            ? previous?.substring(previous.indexOf("?")) ?? null
            : null;

        return (
          <div className="h-full p-4 flex flex-col gap-4">
            {/* The Controls */}
            <div className="rounded-md shadow border border-gray-200 bg-gray-100">
              <div className="p-2 flex flex-row justify-between">
                {/* Counts */}
                <div className="text-sm text-gray-600 flex flex-row items-center">
                  {offset + 1} to {offset + limit} of {count}
                </div>

                {/* Pagination */}
                <div>
                  <a
                    className="rounded-full px-2 py-1 bg-gray-100 hover:[&:not([aria-disabled]=true)]:brightness-95 active:[&:not([aria-disabled]=true)]shadow-inner transition aria-disabled:opacity-30"
                    href={prevSearch ? `/pokemon${prevSearch}` : ""}
                    aria-disabled={!prevSearch}
                  >
                    {"<"}
                  </a>
                  <a
                    className="rounded-full px-2 py-1 bg-gray-100 hover:[&:not([aria-disabled]=true)]:brightness-95 active:[&:not([aria-disabled]=true)]shadow-inner transition aria-disabled:opacity-30"
                    href={nextSearch ? `/pokemon${nextSearch}` : ""}
                    aria-disabled={!nextSearch}
                  >
                    {">"}
                  </a>
                </div>
              </div>
            </div>

            {/* The List */}
            <div
              className={`rounded-md shadow border border-gray-200 relative transition-opacity ${
                fetching ? "opacity-60" : ""
              }`}
            >
              <ul className="rounded-[inherit]">
                {results.map((p) => {
                  const id = Number(p.url.split("/").at(-2));
                  return (
                    <li
                      key={p.name}
                      className="odd:bg-gray-100 p-2 first:rounded-t-md last:rounded-b-md"
                    >
                      <span className="text-gray-700">{id}.</span>{" "}
                      <a
                        className="inline-block px-2 hover:underline cursor-pointer text-blue-900 capitalize"
                        href={`/pokemon/${id}`}
                      >
                        {p.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      }}
    />
  );
}
