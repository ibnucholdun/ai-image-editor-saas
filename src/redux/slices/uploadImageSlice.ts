// src/store/slices/counterSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UploadedImageState {
  fileId: string;
  url: string;
  name: string;
  filePath: string;
}

const initialState: UploadedImageState = {
  fileId: "",
  url: "",
  name: "",
  filePath: "",
};

export const uploadImageSlice = createSlice({
  name: "uploadedImage",
  initialState,
  reducers: {
    setUploadedImage: (state, action: PayloadAction<UploadedImageState>) => {
      state.fileId = action.payload.fileId;
      state.url = action.payload.url;
      state.name = action.payload.name;
      state.filePath = action.payload.filePath;
    },
    clearUploadedImage: (state) => {
      state.fileId = "";
      state.url = "";
      state.name = "";
      state.filePath = "";
    },
  },
});

export const { setUploadedImage, clearUploadedImage } =
  uploadImageSlice.actions;
export default uploadImageSlice.reducer;
