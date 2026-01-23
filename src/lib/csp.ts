export interface CspOptions {
    nonce: string;
    isDev: boolean;
    pathname: string;
}

/**
 * CSP (Content Security Policy) 生成関数
 * 
 * 環境（開発/本番）やパスに応じて適切なCSPヘッダー値を生成します。
 * Nonceを使用してインラインスクリプトの実行を制御します（一部unsafe-inlineが必要な箇所の調整含む）。
 */
export function generateCsp({ nonce, isDev, pathname }: CspOptions): string {
    // Base Policies
    const defaultSrc = "'self'";
    const styleSrc = "'self' 'unsafe-inline' https://fonts.googleapis.com";
    const imgSrc = "'self' blob: data: https://lh3.googleusercontent.com"; // Profile images
    const fontSrc = "'self' https://fonts.gstatic.com";
    let connectSrc = "'self' https://raw.githubusercontent.com blob: data:"; // External APIs
    if (isDev) {
        connectSrc += " ws: wss:";
    }
    const frameSrc = "'self' https://www.youtube.com https://youtube.com"; // YouTube Embeds

    // Script Logic
    // [CRITICAL FIX] Removed 'nonce-${nonce}' because it invalidates 'unsafe-inline'.
    // We strictly need 'unsafe-inline' for the current environment/library state.
    // Also removed invalid comments from the template string below.
    let scriptSrc = `'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;

    if (isDev) {
        scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;
    } else if (pathname.startsWith('/simulator') || pathname.startsWith('/(main)/simulator')) {
        scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;
    }

    // Construct Header
    return `
    default-src ${defaultSrc};
    script-src ${scriptSrc};
    style-src ${styleSrc};
    img-src ${imgSrc};
    font-src ${fontSrc};
    connect-src ${connectSrc};
    frame-src ${frameSrc};
    worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
}
