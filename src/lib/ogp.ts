import ogs from 'open-graph-scraper';

export interface OgMetadata {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
  favicon?: string;
}

export async function fetchOgMetadata(url: string): Promise<OgMetadata> {
  try {
    const options = { url }
    const { result } = await ogs(options);
    
    // ファビコンの取得を試みる（ogsで見つからない場合がある）
    let favicon = result.favicon;
    if (!favicon) {
      const urlObj = new URL(url);
      favicon = `${urlObj.origin}/favicon.ico`;
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
    console.error(`Error fetching OGP for ${url}:`, error);
    return {
      url: url,
    };
  }
}
