export const sanitize = (content: string) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DOMPurify = require('isomorphic-dompurify');
        const sanitizer = DOMPurify.default || DOMPurify;
        return sanitizer.sanitize(content);
    } catch (error) {
        // JSDOM initialization can fail in Next.js SSR due to missing default-stylesheet.css
        // Fallback to returning content as-is
        console.error('Sanitization failed:', error);
        return content;
    }
};
