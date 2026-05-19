import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement =
  document.getElementById("rp-coverage-dashboard-root") ??
  document.getElementById("root");

if (!rootElement) {
  throw new Error("RP Coverage Dashboard root element was not found.");
}

createRoot(rootElement).render(<App />);
