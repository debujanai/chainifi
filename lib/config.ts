
export const isProduction = process.env.NEXT_PUBLIC_APP_MODE === 'production';
export const ALLOWED_SECTIONS = isProduction ? ['Smart Money'] : ['Smart Money', 'Profiler', 'Token God Mode', 'Portfolio'];
