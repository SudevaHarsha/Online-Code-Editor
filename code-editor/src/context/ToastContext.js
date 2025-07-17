import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "default") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically remove after 4s
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col rounded-md shadow-lg w-80 overflow-hidden
              ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : toast.type === "info"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-white"
              }
            `}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span>{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 font-bold"
                >
                  ×
                </button>
              </div>
              {/* Progress Bar */}
              <motion.div
                className="h-1 bg-white"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
