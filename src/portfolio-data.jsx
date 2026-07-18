import { createContext, useContext } from "react";
import { createPortfolioData } from "./data.js";

const PortfolioDataContext = createContext(createPortfolioData());

export function PortfolioDataProvider({ value, children }) {
  return (
    <PortfolioDataContext.Provider value={createPortfolioData(value)}>
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData() {
  return useContext(PortfolioDataContext);
}
