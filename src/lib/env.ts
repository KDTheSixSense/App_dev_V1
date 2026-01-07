import { z } from 'zod';

const clientSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
});

const serverSchema = z.object({
    GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const runtimeEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// During Docker build, we may skip ALL var validation to ensure build passes
// (Client vars will be 'undefined' or empty in the bundle if missing from build args, causing runtime issues, but allowing build)
const skipValidation = !!process.env.SKIP_ENV_VALIDATION;

// Using 'any' type temporarily to allow bypassing strict schema when skipping validation
let envData: any;

if (skipValidation) {
    console.warn('⚠️ Skipping environment validation for build process.');
    envData = runtimeEnv;
} else {
    // In development mode, if variables are missing, we can provide dummy values to prevent crash
    if (process.env.NODE_ENV === 'development') {
        if (!runtimeEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            console.warn('⚠️ Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in development. Using dummy value.');
            runtimeEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "dummy-google-client-id-dev";
        }
        if (!runtimeEnv.GOOGLE_CLIENT_SECRET) {
            console.warn('⚠️ Missing GOOGLE_CLIENT_SECRET in development. Using dummy value.');
            runtimeEnv.GOOGLE_CLIENT_SECRET = "dummy-google-client-secret-dev";
        }
        // Ensure app url has default
        if (!runtimeEnv.NEXT_PUBLIC_APP_URL) {
            runtimeEnv.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
        }
    }

    const parsedClient = clientSchema.safeParse(runtimeEnv);
    const parsedServer = serverSchema.safeParse(runtimeEnv);

    if (!parsedClient.success) {
        console.error('❌ Invalid client environment variables:', parsedClient.error.flatten().fieldErrors);
        throw new Error('Invalid client environment variables');
    }

    if (!parsedServer.success) {
        console.error('❌ Invalid server environment variables:', parsedServer.error.flatten().fieldErrors);
        throw new Error('Invalid server environment variables');
    }

    envData = {
        ...parsedClient.data,
        ...parsedServer.data,
    };
}

export const env = envData as z.infer<typeof clientSchema> & z.infer<typeof serverSchema>;
