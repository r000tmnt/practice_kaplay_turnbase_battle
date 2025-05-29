import { createSlice } from "@reduxjs/toolkit";
import { Unit, Position } from "../model/unit";

const gameSlice = createSlice({
    name: 'game',
    initialState: {
        wave: {
            current: 1,
            max: 3
        },
        tension: {
            current: 0,
            max: 100
        },
        turn: 0,
        units: [] as Unit[],
    },
    reducers : {
        setUnits: (state, action) => {
            state.units = action.payload
        },
        updateUnit: (state, action) => {
            const { name, attribute, } = action.payload
            // Find the unit by name
            const unit = state.units.find((unit) => unit.name === name)
            if (unit) {
                // Update the unit's attributes
                unit.attribute = { ...unit.attribute, ...attribute  }
                unit.action = action.payload.action
            }
        },
        setTension: (state, action) => {
            if(action.payload.current)
                state.tension.current = (state.tension.current + action.payload.current) > state.tension.max ? state.tension.max : state.tension.current + action.payload.current

            if(action.payload.max)
                state.tension.max += action.payload.max            
        }
    }
})

export const { setUnits, updateUnit, setTension } = gameSlice.actions
export default gameSlice.reducer