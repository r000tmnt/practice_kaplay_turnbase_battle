import { createSlice } from "@reduxjs/toolkit";

const settingSlice = createSlice({
    name: 'setting',
    initialState: {
        width: 720,
        height: 1280,
    },
    reducers : {}
})

export const { } = settingSlice.actions
export default settingSlice.reducer