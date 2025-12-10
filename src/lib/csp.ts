export interface CspOptions {
    nonce: string;
    isDev: boolean;
    pathname: string;
}

export function generateCsp({ nonce, isDev, pathname }: CspOptions): string {
    // Base Policies
    const defaultSrc = "'self'";
    const styleSrc = "'self' 'unsafe-inline'"; // Next.js requires unsafe-inline for styles in many cases
    const imgSrc = "'self' blob: data: https://lh3.googleusercontent.com"; // Profile images
    const fontSrc = "'self'";
    const connectSrc = "'self' https://raw.githubusercontent.com blob: data:"; // External APIs

    // Script Logic
    // Default to strict nonce-based policy
    let scriptSrc = `'self' 'nonce-${nonce}' blob:`;

    if (isDev) {
        // Development Mode: Needs looser policy for HMR and DevTools
        scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline' blob:`;
    } else if (pathname.startsWith('/simulator') || pathname.startsWith('/(main)/simulator')) {
        // Simulator Route (Prod): Needs 'unsafe-eval' for code execution feature
        // But we still require nonces for inline scripts to prevent XSS
        scriptSrc = `'self' 'nonce-${nonce}' 'unsafe-eval' blob:`;
    }

    // Construct Header
    return `
    default-src ${defaultSrc};
    script-src ${scriptSrc};
    style-src ${styleSrc};
    img-src ${imgSrc};
    font-src ${fontSrc};
    connect-src ${connectSrc};
    // Workers might need eval depending on libraries (Blockly uses workers?)
    worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
}
