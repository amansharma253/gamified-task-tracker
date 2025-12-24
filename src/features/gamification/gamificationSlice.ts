import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { GamificationProfile } from "../../domain/gamification/types";
import * as repo from "../../services/storage/repositories";

export type GamificationState = {
  profile: GamificationProfile | null;
  loading: boolean;
};

const initialState: GamificationState = {
  profile: null,
  loading: false,
};

export const loadGamification = createAsyncThunk("gamification/load", async () => {
  return repo.loadProfile();
});

export const saveGamification = createAsyncThunk(
  "gamification/save",
  async (profile: GamificationProfile) => {
    await repo.saveProfile(profile);
    return profile;
  }
);

const slice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<GamificationProfile>) {
      state.profile = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadGamification.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadGamification.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(loadGamification.rejected, (state) => {
        state.loading = false;
      })
      .addCase(saveGamification.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { setProfile } = slice.actions;

export const selectProfile = (state: RootState) => state.gamification.profile;

export default slice.reducer;
