import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import "./index.css";

console.log("[GF.Chat] main.tsx loaded");

const root = document.getElementById("root");
console.log("[GF.Chat] root element:", root);

if (!root) {
  document.body.innerHTML =
    "<div style='padding:24px;font-family:sans-serif;color:red'>GF.Chat boot error: #root not found</div>";
  throw new Error("GF.Chat boot error: #root not found");
}

// Set temporary booting message
root.innerHTML =
  "<div style='padding:24px;font-family:sans-serif'>GF.Chat booting...</div>";

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
