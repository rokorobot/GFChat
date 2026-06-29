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
  "<div style='padding:24px;font-family:sans-serif;color:#ec4899;font-weight:bold'>GF.Chat booting...</div>";

console.log("[GF.Chat] before createRoot");
const reactRoot = ReactDOM.createRoot(root);
console.log("[GF.Chat] after createRoot, before render");

try {
  reactRoot.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("[GF.Chat] render call completed");
} catch (error) {
  console.error("[GF.Chat] synchronous render failure", error);
  root.innerHTML =
    `<div style='padding:24px;color:red;font-family:sans-serif'>GF.Chat synchronous render failure. Error: ${error}</div>`;
}

setTimeout(() => {
  console.log("[GF.Chat] post-render root HTML length:", root.innerHTML.length);
  console.log("[GF.Chat] post-render root preview:", root.innerHTML.slice(0, 300));
}, 100);
