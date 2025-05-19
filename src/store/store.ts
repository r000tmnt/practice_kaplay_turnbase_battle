import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './game';
import settingReducer from './setting';

const store = configureStore({
    reducer: {
        game: gameReducer,
        setting: settingReducer
    }
})

export default store;