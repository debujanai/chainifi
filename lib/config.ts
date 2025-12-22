
// Safer check for production mode
const mode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();

export const isProduction = mode === 'production';

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
    console.log("DEBUG: APP_MODE is:", mode, "isProduction:", isProduction);
}

// These are the pages that are fully functional in production
export const PUBLIC_PAGES = ['/holdings', '/dex-trades', '/perp-trades', '/'];

// These are all the sections we have
export const ALL_SECTIONS = ['Smart Money', 'Profiler', 'Token God Mode', 'Portfolio'];

// These are all the smart money sub-pages
export const ALL_SMART_MONEY_PAGES = ['/netflows', '/holdings', '/historical-holdings', '/dex-trades', '/perp-trades', '/dcas'];

// For backward compatibility or internal checks
export const ALLOWED_SECTIONS = ALL_SECTIONS;
export const ALLOWED_SMART_MONEY_PAGES = ALL_SMART_MONEY_PAGES;
