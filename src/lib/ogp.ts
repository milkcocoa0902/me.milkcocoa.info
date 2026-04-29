import ogs from 'open-graph-scraper-lite';

export interface OgMetadata {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
  favicon?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(id);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchOgMetadata(url: string, retries = 2): Promise<OgMetadata> {
  for (let i = 0; i <= retries; i++) {
    try {
      const html = await fetchWithTimeout(url, 10000);
      const { result } = await ogs({ html });

      // ファビコンの取得を試みる（ogsで見つからない場合がある）
      let favicon = result.favicon;
      if (!favicon) {
        try {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}/favicon.ico`;
        } catch (e) {
          // ignore
        }
      }

      return {
        title: result.ogTitle || result.twitterTitle || "",
        description: result.ogDescription || result.twitterDescription || "",
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "",
        url: url,
        siteName: result.ogSiteName || "",
        favicon: favicon,
      };
    } catch (error) {
      if (i === retries) {
        console.error(`Error fetching OGP for ${url} after ${retries} retries:`, error);
        return {
          url: url,
        };
      }
      console.warn(`Retry fetching OGP for ${url} (${i + 1}/${retries})... due to ${error instanceof Error ? error.message : 'unknown error'}`);
      await sleep(1000 * (i + 1)); // 指数バックオフ的な待機
    }
  }
  return { url };
}
