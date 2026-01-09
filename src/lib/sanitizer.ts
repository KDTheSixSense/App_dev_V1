export const sanitize = (content: string) => {
    if (!content) return '';
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DOMPurify = require('isomorphic-dompurify');
        const sanitizer = DOMPurify.default || DOMPurify;
        return sanitizer.sanitize(content);
    } catch (error) {
        // Fail-closed: Return empty string on error to prevent XSS
        console.error('Sanitization failed:', error);
        return '';
    }
};
