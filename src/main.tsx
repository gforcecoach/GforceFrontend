import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "react-query"
import { Toaster } from "react-hot-toast"
import App from "./App"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--app-surface-strong)",
            color: "var(--app-text)",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid var(--app-border)",
            boxShadow: "var(--app-shadow)",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "var(--app-success)",
              secondary: "var(--app-accent-contrast)",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "var(--app-danger)",
              secondary: "var(--app-accent-contrast)",
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
