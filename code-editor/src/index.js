import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CodeEditorProvider } from "./context/CodeEditorContext";
import { UserProvider } from "./context/UserContext";
import { FileProvider } from "./context/UseFileContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
      <BrowserRouter>
        <UserProvider>
          <FileProvider>
            <CodeEditorProvider>
              <App />
            </CodeEditorProvider>
          </FileProvider>
        </UserProvider>
      </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
