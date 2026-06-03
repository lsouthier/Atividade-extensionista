import { Middleware } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../index';

export const debugMiddleware: Middleware<{}, RootState> =
    (storeAPI) => (next: AppDispatch) => (action: any) => {
        console.log('📋 [REDUX ACTION]', action.type);
        
        // Alerta para criação de tutor
        if (action.type.includes('tutores/criar')) {
            console.warn('🚨 AÇÃO DE CRIAÇÃO DE TUTOR DETECTADA!');
            console.warn('Payload:', action.payload);
            console.warn('Stack:', new Error().stack);
        }

        // Alerta para QUALQUER ação
        if (action.payload) {
            console.log('  → Payload:', action.payload);
        }

        return next(action);
    };