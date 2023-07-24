import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import * as App from "./App";
import { Mvu } from "./react-mvu/MVU";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Mvu
      init={App.init}
      update={App.update}
      View={App.View}
      onPathChange={(path) => App.Msg("pathUpdated")({ path })}
      onUrlRequest={(urlRequest) => App.Msg("linkClicked")({ urlRequest })}
      enableDevTools
    />
  </React.StrictMode>
);
