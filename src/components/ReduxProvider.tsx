// src/providers/ReduxProvider.tsx
"use client";

import { Provider } from "react-redux";

import { type ReactNode } from "react";
import { store } from "~/redux/store";

interface Props {
  children: ReactNode;
}

export const ReduxProvider = ({ children }: Props) => {
  return <Provider store={store}>{children}</Provider>;
};
