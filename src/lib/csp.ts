export interface CspOptions {
    nonce: string;
    isDev: boolean;
    pathname: string;
}

export function generateCsp({ nonce, isDev, pathname }: CspOptions): string {
    // Base Policies
    const defaultSrc = "'self'";
    const styleSrc = "'self' 'unsafe-inline' https://fonts.googleapis.com";
    const imgSrc = "'self' blob: data: https://lh3.googleusercontent.com"; // Profile images
    const fontSrc = "'self' https://fonts.gstatic.com";
    const connectSrc = "'self' https://raw.githubusercontent.com blob: data:"; // External APIs
    const frameSrc = "'self' https://www.youtube.com https://youtube.com"; // YouTube Embeds

    // Script Logic
    // Default to strict nonce-based policy
    // Added https://cdn.jsdelivr.net (Ace Editor etc) and https://static.doubleclick.net (YouTube/Ads)
    let scriptSrc = `'self' 'nonce-${nonce}' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;

    const pathsNeedingUnsafeEval = [
        '/simulator',
        '/(main)/simulator',
        '/customize_trace',
        '/group/coding-page',
        '/issue_list/programming_problem',
        '/event/event_detail',
    ];

    if (isDev) {
        // Development Mode: Needs looser policy for HMR and DevTools
        scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;
    } else if (pathsNeedingUnsafeEval.some(p => pathname.startsWith(p))) {
        // Routes using code editors (Ace, Blockly) need 'unsafe-eval'
        // But we still require nonces for inline scripts to prevent XSS
        scriptSrc = `'self' 'nonce-${nonce}' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://static.doubleclick.net`;
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
    // Workers might need eval depending on libraries (Blockly uses workers?)
    worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
}
