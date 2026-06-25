import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { App } from "./App";

const convex = new ConvexReactClient("https://intent-condor-300.eu-west-1.convex.cloud");

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  );
}
