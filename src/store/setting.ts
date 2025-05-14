import { createSlice, configureStore } from "@reduxjs/toolkit";

const settingSlice = createSlice({
    name: 'setting',
    initialState: {
        width: 720,
        height: 1280
    },
    reducers : {}
})

const settingStore = configureStore({
    reducer: settingSlice.reducer,
})

export default settingStore