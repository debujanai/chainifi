
// Safer check for production mode
const mode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();

export const isProduction = mode === 'production';

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
    console.log("DEBUG: APP_MODE is:", mode, "isProduction:", isProduction);
}

// In production, we only want these specific sub-pages visible
export const ALLOWED_SMART_MONEY_PAGES = isProduction
    ? ['/holdings', '/dex-trades', '/perp-trades']
    : ['/netflows', '/holdings', '/historical-holdings', '/dex-trades', '/perp-trades', '/dcas'];

export const ALLOWED_SECTIONS = isProduction
    ? ['Smart Money']
    : ['Smart Money', 'Profiler', 'Token God Mode', 'Portfolio'];
