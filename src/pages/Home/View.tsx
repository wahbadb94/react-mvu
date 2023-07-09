import { ViewProps } from "../../react-mvu/types";
import { Model, Msg } from "./ModelUpdate";

export function View({
  model: { welcomeMsg },
}: Pick<ViewProps<Model, Msg>, "model">): JSX.Element {
  return (
    <div className="p-4">
      <h1 className="text-center text-xl">
        This is a Demo for my ReactMVU library.
      </h1>

      <p>{welcomeMsg}</p>
    </div>
  );
}
