import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />

    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 3500,

        style: {
          borderRadius: "20px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(226,232,240,0.8)",
          color: "#0f172a",
          padding: "16px 18px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        },

        success: {
          style: {
            border: "1px solid rgba(10,107,184,0.15)",
          },

          iconTheme: {
            primary: "#0A6BB8",
            secondary: "#fff",
          },
        },

        error: {
          style: {
            border: "1px solid rgba(220,38,38,0.15)",
          },

          iconTheme: {
            primary: "#dc2626",
            secondary: "#fff",
          },
        },
      }}
    />
  </React.StrictMode>,
);
