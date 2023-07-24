import { ViewProps } from "../../react-mvu/types";
import RenderRemoteData from "../../react-mvu/RenderRemoteData";
import { Model, Msg } from "./ModelUpdate";
import Link from "../components/Link";

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
          <div className="h-full p-4 flex flex-col gap-4 overflow-y-hidden">
            {/* The Controls */}
            <div className="rounded-md shadow border border-gray-300 bg-white">
              <div className="p-4 flex flex-row justify-between">
                {/* Counts */}
                <div className="text-sm text-gray-600 flex flex-row items-center">
                  {offset + 1} to {offset + limit} of {count}
                </div>

                {/* Pagination */}
                <div>
                  <a
                    className="text-center inline-block border border-transparent rounded-full px-[11px] py-1 bg-white hover:aria-[disabled=false]:bg-gray-100 hover:aria-[disabled=false]:border-gray-200 active:aria-[disabled=false]:shadow-inner transition aria-disabled:opacity-30"
                    href={prevSearch ? `/pokemon${prevSearch}` : ""}
                    aria-disabled={!prevSearch}
                  >
                    {"<"}
                  </a>
                  <a
                    className="text-center inline-block border border-transparent ml-2 rounded-full px-[11px] py-1 bg-white hover:aria-[disabled=false]:bg-gray-100 hover:aria-[disabled=false]:border-gray-200 active:aria-[disabled=false]:shadow-inner transition aria-disabled:opacity-30"
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
              className={`overflow-y-auto rounded-md shadow border border-gray-300 relative transition-opacity ${
                fetching ? "opacity-60" : ""
              }`}
            >
              <ul className="rounded-[inherit] overflow-y-auto">
                {results.map((p) => {
                  const id = Number(p.url.split("/").at(-2));
                  return (
                    <li
                      key={p.name}
                      className="odd:bg-white even:bg-slate-50 p-4 first:rounded-t-md last:rounded-b-md border-solid border-0 [&:not(:last-child)]:border-b border-gray-300"
                    >
                      <span className="text-gray-700">{id}.</span>{" "}
                      <Link
                        className="inline-block px-2 capitalize"
                        href={`/pokemon/${id}`}
                      >
                        {p.name}
                      </Link>
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
