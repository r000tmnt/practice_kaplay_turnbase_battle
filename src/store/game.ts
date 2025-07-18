import { createSlice } from "@reduxjs/toolkit";
import { Unit } from "../model/unit";

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
        turn: 1,
        units: [] as Unit[],
        pointedTarget: -1,
        currentActivePlayer: -1,
        activeUnits: [] as number[],
        inactiveUnits: [] as number[],
        timerToAct: {} as { index: number, value: boolean },
        currentCastingSkill: '',
        effectTurnCounter: [] as {unit: Unit, turn: number}[], 
        inventory: [
            { id: 1, amount: 5 },
            { id: 2, amount: 5 },
            { id: 3, amount: 5 },
        ] as { id: number, amount: number }[],
        stopAll: false,
    },
    reducers : {
        setUnits: (state, action) => {
            state.units = action.payload
        },
        updateUnit: (state, action) => {
            const { name, attribute, } = action.payload
            // Find the unit by name
            console.log('update unit', name)
            console.log('hp', attribute.hp)

            // If the unit's hp has beem updated
            const unit = state.units.find(unit => unit.name === name)
            if(unit && unit.attribute.hp !== 0){
                unit.action = action.payload.action
                console.log(state.units)
            }else console.log('unit destroyed', name)
        },
        setActiveUnits: (state, action) => {
            state.activeUnits = action.payload        
        },
        setInactiveUnits: (state, action) => {
            state.inactiveUnits = action.payload        
        },        
        setTimerToAct: (state, action) => {
            state.timerToAct = action.payload
        },   
        setTurn: (state, action) => {
            state.turn = action.payload
        },     
        setWave: (state, action) => {
            state.wave.current += action.payload
        },
        setTension: (state, action) => {
            if(action.payload.current)
                state.tension.current = (state.tension.current + action.payload.current) > state.tension.max ? state.tension.max : state.tension.current + action.payload.current

            if(action.payload.max)
                state.tension.max += action.payload.max            
        },
        setPointedTarget: (state, action) => {
            state.pointedTarget = action.payload
        },
        setCurrentActivePlayer: (state, action) => {
            state.currentActivePlayer = action.payload
        },
        setCurrentCastingSkill: (state, action) => {
            state.currentCastingSkill = action.payload
        },
        updateEffectTurnCounter: (state, action) => {
            state.effectTurnCounter = action.payload
        },
        setInventory: (state, action) => {
            state.inventory = action.payload
        },
        setAllToStop: (state, action) => {
            state.stopAll = action.payload
        }
    }
})

export const { 
    setUnits, updateUnit, setWave, 
    setTension, setCurrentActivePlayer, setCurrentCastingSkill, 
    updateEffectTurnCounter, setAllToStop, setInventory,
    setPointedTarget, setTimerToAct, setActiveUnits,
    setInactiveUnits, setTurn
} = gameSlice.actions
export default gameSlice.reducer