import { createSlice } from "@reduxjs/toolkit";

const settingSlice = createSlice({
    name: 'setting',
    initialState: {
        width: 720,
        height: 1280,
        scale: 0,
        uiOffsetV: 0,
        uiOffsetH: 0,
    },
    reducers : {
        setScale: (state, action) => {
            state.scale = action.payload
        },
        setUIoffset: (state, action) => {
            const { v, h } = action.payload
            state.uiOffsetV = v
            state.uiOffsetH = h
        }
    }
})

export const { setScale, setUIoffset } = settingSlice.actions
export default settingSlice.reducer