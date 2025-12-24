import { configureStore } from "@reduxjs/toolkit";
import tasksReducer from "../features/tasks/tasksSlice";
import gamificationReducer from "../features/gamification/gamificationSlice";

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    gamification: gamificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
