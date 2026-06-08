import { configureStore } from '@reduxjs/toolkit';
import animaisReducer from './animaisSlice';
import tutoresReducer from './tutoresSlice';
import clinicasReducer from './clinicasSlice';
import castracoeReducer from './castracoeSlice';
import authReducer from './authSlice';
import usuariosReducer from './usuariosSlice';
import auditoriaReducer from './auditoriaSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        animais: animaisReducer,
        tutores: tutoresReducer,
        clinicas: clinicasReducer,
        castracoes: castracoeReducer,
        usuarios: usuariosReducer,
        auditoria: auditoriaReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
