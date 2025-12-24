import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "../components/ui/sonner";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      {children}
      <Toaster richColors closeButton />
    </Provider>
  );
}
