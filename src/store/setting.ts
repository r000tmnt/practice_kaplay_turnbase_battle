import { createSlice } from "@reduxjs/toolkit";

const settingSlice = createSlice({
    name: 'setting',
    initialState: {
        width: 720,
        height: 1280,
        scale: 0,
    },
    reducers : {
        setScale: (state, action) => {
            state.scale = action.payload
        }
    }
})

export const { setScale } = settingSlice.actions
export default settingSlice.reducer