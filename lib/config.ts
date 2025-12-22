
// Safer check for production mode
const mode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();

export const isProduction = mode === 'production';

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
    console.log("DEBUG: APP_MODE is:", mode, "isProduction:", isProduction);
}

export const ALLOWED_SECTIONS = isProduction ? ['Smart Money'] : ['Smart Money', 'Profiler', 'Token God Mode', 'Portfolio'];
