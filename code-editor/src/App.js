import logo from "./logo.svg";
import "./App.css";
import Header from "./navigations/Header";
import EditorPanel from "./components/EditorPannel";
import OutputPanel from "./components/OutputPannel";
import { Route, Router, Routes, Switch } from "react-router-dom";
import SnippetsPage from "./pages/SnippetsPage";
import EditorPage from "./pages/EditorPage";
import SignInPage from "./components/Auth/SignIn";
import SignUpPage from "./components/Auth/SignUp";

function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route
        path="/snippets"
        element={
            <SnippetsPage />
        }
      />
      <Route path="/" element={<EditorPage />} />
      <Route path="/editor/:id" element={<EditorPage />} />
    </Routes>
  );
}

export default App;
