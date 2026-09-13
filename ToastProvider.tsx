"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#1D2030",
          color: "#F2F1ED",
          border: "1px solid #2A2D3C",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#3FD6C4", secondary: "#0E0F13" } },
        error: { iconTheme: { primary: "#E5637A", secondary: "#0E0F13" } },
      }}
    />
  );
}
