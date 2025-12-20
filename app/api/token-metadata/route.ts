import { NextResponse } from 'next/server';

interface TokenMetadata {
    logo: string | null;
    websites: { url: string }[];
    socials: { platform: string; type?: string; handle: string; url: string }[];
}

// Helper to normalized chain names for GeckoTerminal
function mapChainToGecko(chain: string): string {
    const c = chain.toLowerCase();
    if (c === 'ethereum') return 'eth';
    if (c === 'bsc') return 'bsc';
    if (c === 'polygon') return 'polygon_pos';
    if (c === 'avalanche') return 'avax';
    if (c === 'arbitrum') return 'arbitrum';
    if (c === 'optimism') return 'optimism';
    if (c === 'base') return 'base';
    if (c === 'solana') return 'solana';
    return c;
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3, backoff = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'force-cache' });

            if (response.status === 429) {
                console.warn(`Rate limit hit for ${url}. Retrying in ${backoff}ms...`);
                await delay(backoff);
                backoff *= 2; // Exponential backoff
                continue;
            }

            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error(`Fetch error for ${url}:`, e);
            if (i === retries - 1) return null;
            await delay(backoff);
        }
    }
    return null;
}

async function fetchDexScreener(chain: string, address: string): Promise<TokenMetadata | null> {
    const url = `https://api.dexscreener.com/token-pairs/v1/${chain}/${address}`;
    const pairs = await fetchWithRetry(url);

    if (!Array.isArray(pairs) || pairs.length === 0) return null;

    const pairWithInfo = pairs.find((p: any) => p.info && (p.info.imageUrl || p.info.socials));
    if (!pairWithInfo || !pairWithInfo.info) return null;

    const info = pairWithInfo.info;

    // Validation
    if (!info.imageUrl && (!info.socials || info.socials.length === 0)) return null;

    return {
        logo: info.imageUrl || null,
        websites: info.websites || [],
        socials: info.socials || []
    };
}

async function fetchGeckoTerminal(chain: string, address: string): Promise<TokenMetadata | null> {
    const geckoChain = mapChainToGecko(chain);
    const url = `https://api.geckoterminal.com/api/v2/networks/${geckoChain}/tokens/${address}/info`;
    const json = await fetchWithRetry(url);

    const attr = json?.data?.attributes;
    if (!attr) return null;

    const socials: any[] = [];
    if (attr.twitter_handle) {
        socials.push({ platform: 'twitter', url: `https://twitter.com/${attr.twitter_handle}`, handle: attr.twitter_handle });
    }
    if (attr.telegram_handle) {
        socials.push({ platform: 'telegram', url: `https://t.me/${attr.telegram_handle}`, handle: attr.telegram_handle });
    }
    if (attr.discord_url) {
        socials.push({ platform: 'discord', url: attr.discord_url, handle: '' });
    }

    const websites: any[] = [];
    if (attr.websites && Array.isArray(attr.websites)) {
        attr.websites.forEach((w: string) => websites.push({ url: w }));
    }

    return {
        logo: attr.image_url || null,
        websites: websites,
        socials: socials
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');

    if (!chain || !address) {
        return NextResponse.json({ error: 'Missing chain or address' }, { status: 400 });
    }

    // 1. DexScreener (Primary Source)
    let metadata = await fetchDexScreener(chain, address);

    // 2. GeckoTerminal (Fallback)
    if (!metadata) {
        // If DexScreener failed or had no data, wait briefly before hitting fallback to be nice
        await delay(500);
        metadata = await fetchGeckoTerminal(chain, address);
    }

    return NextResponse.json(metadata || { logo: null, websites: [], socials: [] });
}
