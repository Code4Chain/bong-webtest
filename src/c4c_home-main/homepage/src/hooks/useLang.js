
import { createContext, useContext } from 'react';

export const LangContext = createContext("ko");

export function useLang() {
    return useContext(LangContext);
}
