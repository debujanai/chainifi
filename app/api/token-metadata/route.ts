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

async function fetchDexScreener(chain: string, address: string): Promise<TokenMetadata | null> {
    try {
        const url = `https://api.dexscreener.com/token-pairs/v1/${chain}/${address}`;
        // Cache indefinitely (force-cache) as metadata rarely changes
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'force-cache' });

        if (!response.ok) return null;

        const pairs = await response.json();
        if (!Array.isArray(pairs) || pairs.length === 0) return null;

        const pairWithInfo = pairs.find((p: any) => p.info && (p.info.imageUrl || p.info.socials));
        if (!pairWithInfo || !pairWithInfo.info) return null;

        const info = pairWithInfo.info;

        // Validation: If no logo AND no socials, consider it a "miss" so we can try backup
        if (!info.imageUrl && (!info.socials || info.socials.length === 0)) return null;

        return {
            logo: info.imageUrl || null,
            websites: info.websites || [],
            socials: info.socials || []
        };
    } catch (e) {
        console.error("DexScreener Fetch Error:", e);
        return null;
    }
}

async function fetchGeckoTerminal(chain: string, address: string): Promise<TokenMetadata | null> {
    try {
        const geckoChain = mapChainToGecko(chain);
        const url = `https://api.geckoterminal.com/api/v2/networks/${geckoChain}/tokens/${address}/info`;

        // GeckoTerminal Rate Limit: 30/min. We must be careful.
        // Since this is a fallback server-side, it might get hit often if DexScreener misses repeatedly.
        // However, with Next.js Data Cache (revalidate 86400), we only hit it once per day per token.

        // Cache indefinitely (force-cache)
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'force-cache' });

        if (!response.ok) return null;

        const json = await response.json();
        const attr = json.data?.attributes;

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
    } catch (e) {
        console.error("GeckoTerminal Fetch Error:", e);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');

    if (!chain || !address) {
        return NextResponse.json({ error: 'Missing chain or address' }, { status: 400 });
    }

    // 1. Try DexScreener (Primary)
    let metadata = await fetchDexScreener(chain, address);

    // 2. Fallback to GeckoTerminal if DexScreener failed or returned null
    if (!metadata) {
        // console.log(`DexScreener miss for ${chain}:${address}, trying GeckoTerminal...`);
        metadata = await fetchGeckoTerminal(chain, address);
    }

    // 3. Return results (or empty structure if both failed)
    return NextResponse.json(metadata || { logo: null, websites: [], socials: [] });
}
