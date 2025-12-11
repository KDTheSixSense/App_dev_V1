export const SECURITY_HEADERS = {
  crossOriginResourcePolicy: 'same-origin',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  dnsPrefetchControl: 'on',
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  xXssProtection: '1; mode=block',
  xFrameOptions: 'SAMEORIGIN',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
} as const;
