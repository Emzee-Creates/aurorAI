import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import localforage from "localforage";
import App from "./App";
import { WalletProvider } from "./context/WalletContext";
import "./styles/globals.css";

// --- Configure localforage for IndexedDB persistence ---
localforage.config({
  name: "ai-risk-dashboard-cache",
});

// --- Create QueryClient ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
    },
  },
});

// --- Create async persister ---
const persister = createAsyncStoragePersister({
  storage: localforage,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <BrowserRouter>
        {/* ✅ Wrap App in WalletProvider so Dashboard can access the context */}
        <WalletProvider>
          <App />
        </WalletProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
