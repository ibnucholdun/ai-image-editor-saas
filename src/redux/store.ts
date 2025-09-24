import { configureStore } from "@reduxjs/toolkit";
import { projectReducer } from "./slices/projectSlice";

export const store = configureStore({
  reducer: {
    projectReducer: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
