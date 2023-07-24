import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ViewProps } from "../../react-mvu/types";
import { Model, Msg } from "./ModelUpdate";
import { prism as dark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function View({
  model: { welcomeMsg },
}: Pick<ViewProps<Model, Msg>, "model">): JSX.Element {
  return (
    <div className="py-4 px-8 bg-white h-full border-x border-solid border-y-0 border-gray-300 flex flex-col gap-4 overflow-y-auto">
      <section className="text-center">
        <h1 className="text-2xl">
          This is a Demo for the{" "}
          <span className="text-green-800 hover:underline cursor-pointer">{`"react-mvu"`}</span>{" "}
          library.
        </h1>
        <p className="text-gray-800">
          This project is my attempt to bring the {`"MVU"`} architecture to
          React.
        </p>
        <p className="text-gray-800">
          All Pokémon data is provided by{" "}
          <a
            href="https://pokeapi.co/"
            className="hover:underline text-blue-900"
          >
            pokeapi.co
          </a>
          .
        </p>
        <p className="text-gray-700 hidden">{welcomeMsg}</p>
      </section>

      <section
        id="what-is-mvu"
        className="flex flex-col gap-2 [&>p]:text-gray-900"
      >
        <h2 className="text-xl">What is MVU?</h2>

        <p>
          {`"MVU"`}{" "}
          <span className="italic">{`(also known as "The Elm Architecture" or "TEA")`}</span>{" "}
          stands for {`"Model View Update"`}, and is a way of architecting user
          interfaces that I believe lends itself particularly well to teams of
          developers and/or applications that need to scale and evolve over
          time.
        </p>

        <p>
          Fundamentally there are only 3 things:
          <ol className="px-8 list-disc mt-1">
            <li>
              A <span className="font-bold">M</span>odel data structure: The
              current state of your application. React developers tend to use
              the word,
              {`"State"`}, so you can think of Model as being your state. The
              main difference is that in MVU, your app only has one state. So
              the model in MVU {`isn't `} just some state, it&lsquo;s{" "}
              <span className="italic">THE</span> state.
            </li>
            <li>
              A <span className="font-bold">V</span>iew function: A function
              (React functional component), that takes the model as a prop, and
              displays the UI based on that model.
            </li>
            <li>
              An <span className="font-bold">U</span>pdate function: A function
              that, when given the current model and some message, knows how to
              update the model, i.e. produce the next state of the app.
            </li>
          </ol>
        </p>

        <p>
          Technically the acronym MVU is incomplete. There is also the{" "}
          {`"Message" (usually written "Msg")`} data structure which, as
          mentioned above, is needed by the update function in order to produce
          the next model. So, with Model, Msg, View, and Update you can create
          the obligitory counter application. Which would look something like
          this:
        </p>

        <div className="p-4 border border-gray-300 mt-4 rounded-md bg-slate-200 shadow-inner">
          <div className="border rounded-md border-gray-300 shadow">
            <SyntaxHighlighter
              language="typescript"
              style={dark}
              customStyle={{
                borderRadius: "8px",
                marginTop: 0,
                marginBottom: 0,
                backgroundColor: "white",
              }}
            >
              {counterCode}
            </SyntaxHighlighter>
          </div>
        </div>
      </section>
    </div>
  );
}

const counterCode = `
type Model = {
  count: number;
};

type Msg = Tagged<"increment"> | Tagged<"decrement">;
const Msg = Constructors<Msg>();

const init = (): Model => ({
  count: 0,
});

const update = (model: Model, msg: Msg): Model =>
  match.tagged(msg).on({
    decrement: () => ({ count: model.count - 1 }),
    increment: () => ({ count: model.count + 1 }),
  });

function View({ model, dispatch }: ViewProps<Model, Msg>): JSX.Element {
  return (
    <div>
      <button onClick={() => dispatch(Msg("increment")({}))}>+</button>

      <div>You clicked {model.count}</div>

      <button onClick={() => dispatch(Msg("decrement")({}))}>-</button>
    </div>
  );
}
`;
