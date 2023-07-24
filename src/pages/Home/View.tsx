import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ViewProps } from "../../react-mvu/types";
import { Model, Msg } from "./ModelUpdate";
import { prism as dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Code from "../components/Code";
import Link from "../components/Link";

export function View({
  model: { welcomeMsg },
}: Pick<ViewProps<Model, Msg>, "model">): JSX.Element {
  return (
    <div className="py-4 px-8 bg-white h-full border-x border-solid border-y-0 border-gray-300 flex flex-col gap-4 overflow-y-auto pb-16">
      <section className="text-center">
        <h1 className="text-2xl font-semibold">
          This is a Demo for the{" "}
          <a
            href={"https://github.com/wahbadb94/react-mvu"}
            className="text-green-800 hover:underline cursor-pointer"
          >{`"react-mvu"`}</a>{" "}
          library.
        </h1>
        <p className="text-gray-800">
          This project is my attempt to bring the {`"MVU"`} architecture to
          React.
        </p>
        <p className="text-gray-800">
          All Pokémon data is provided by{" "}
          <Link
            href="https://pokeapi.co/"
            className="hover:underline text-blue-900"
          >
            pokeapi.co
          </Link>
          .
        </p>
        <p className="text-gray-700 hidden">{welcomeMsg}</p>
      </section>

      <section
        id="what-is-mvu"
        className="flex flex-col gap-2 [&>p]:text-gray-900"
      >
        <h2 className="text-xl font-semibold">What is MVU?</h2>

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
              <span className="font-bold">M</span>odel (data structure): The
              current state of your application. React developers tend to use
              the word
              {` "state"`}, so you can think of <Code>Model</Code> as being your
              state. The main difference is that in MVU, your app only has one
              state. So <Code>Model</Code> in MVU {`isn't `} just any state,
              {` it's`} <span className="italic">THE</span> state.
            </li>
            <li>
              <span className="font-bold">V</span>iew (function): A function
              (React functional component), that takes the model as a prop, and
              displays the UI based on that model.
            </li>
            <li>
              <span className="font-bold">U</span>pdate (function): A function
              that, when given the current model and some message, knows how to
              update the model, i.e. produce the next state of the app. As a
              side note, this is done <i>immutably</i>, meaning{" "}
              <Code>update</Code> returns a new <Code>Model</Code>, rather than
              making changes to the old one. A nice benefit of doing things this
              way is we can keep track of the history of our application by
              maintaining a list of all the <Code>Model</Code>s the{" "}
              <Code>update</Code> function has produced during the life of the
              app. You can actually view the <Code>Model</Code> history for this
              site if you would like. Try navigating to the{" "}
              <Link href="/pokemon">Pokemon Page</Link> and then click the
              DevTools in the bottom right corner.
            </li>
          </ol>
        </p>

        <p>
          Technically the acronym MVU is incomplete. There is also the{" "}
          {`"Message"`} (usually written <Code>Msg</Code>) which, as mentioned
          above, is needed by the <Code>update</Code> function in order to
          produce the next model. So, with Model, Msg, View, and Update you can
          create the obligatory counter application. Which would look something
          like this:
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

      <section
        id="where-is-useState"
        className="flex flex-col gap-2 [&>p]:text-gray-900"
      >
        <h2 className="text-xl font-semibold">
          Where is the <Code>useState</Code> hook?
        </h2>

        <p>
          In React, the <Code>useState</Code> hook allows you to create{" "}
          {`"stateful"`} components. These components then {`"own"`} that state.
          Which is fine, and is part of the reason why react is so easy to start
          using. However, as the application grows, or as your team grows, the
          various states and the transitions between them become increasingly
          difficult to keep track of.
        </p>

        <p></p>

        <p>
          So what {`I'm`} saying is: {`"There is no `} <Code>useState</Code>
          {` hook!"`} And not just in user code, the <Code>react-mvu</Code>{" "}
          source code {`doesn't`} have a single <Code>useState</Code> instance
          either! (Though, I think technically there is one abstracted away via
          the <Code>useSyncExternalStore</Code> hook, but we can pretend we{" "}
          {`don't`} know that 😉) All state transitions are piped through a
          <span className="italic"> single</span> <Code>update</Code>
          function, which produces a new version of the{" "}
          <span className="italic">singular</span> state of your application.
        </p>

        <p>
          <span className="font-semibold">TLDR:</span> Friendship with stateful
          components terminated. Functional purity is my best friend now.
        </p>
      </section>
    </div>
  );
}

const counterCode = `type Model = {
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
      <button onClick={() => dispatch(Msg("increment")({}))}> + </button>

      <div>The current count: {model.count}.</div>

      <button onClick={() => dispatch(Msg("decrement")({}))}> - </button>
    </div>
  );
}
`;
