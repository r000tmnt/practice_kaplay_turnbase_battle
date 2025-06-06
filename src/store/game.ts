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
        currentActivePlayer: -1,
    },
    reducers : {
        setUnits: (state, action) => {
            state.units = action.payload
        },
        updateUnit: (state, action) => {
            const { name, attribute, } = action.payload
            // Find the unit by name
            state.units.map((unit) => {
                if(unit.name === name){
                    unit.attribute = { ...attribute }
                    unit.action = action.payload.action
                }
            })
        },
        setTension: (state, action) => {
            if(action.payload.current)
                state.tension.current = (state.tension.current + action.payload.current) > state.tension.max ? state.tension.max : state.tension.current + action.payload.current

            if(action.payload.max)
                state.tension.max += action.payload.max            
        },
        setCurrentActivePlayer: (state, action) => {
            state.currentActivePlayer = action.payload
        }
    }
})

export const { setUnits, updateUnit, setTension, setCurrentActivePlayer } = gameSlice.actions
export default gameSlice.reducer