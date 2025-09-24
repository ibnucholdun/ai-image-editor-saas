import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Project {
  name: string | null;
  filePath: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  imageUrl: string;
  imageKitId: string;
}

interface ProjectState {
  projects: Project[];
}

const initialState: ProjectState = {
  projects: [],
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setUserProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    addUserProject: (state, action: PayloadAction<Project>) => {
      state.projects = [action.payload, ...state.projects];
    },
    clearUserProjects: (state) => {
      state.projects = [];
    },
  },
});

export const { setUserProjects, addUserProject, clearUserProjects } =
  projectSlice.actions;
export const projectReducer = projectSlice.reducer;
