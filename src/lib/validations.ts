import { z } from 'zod';

// SQL Injection対策: 一般的な攻撃文字列を明示的に禁止するRegex
const sqlInjectionPattern = /['";\-\-]/;

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email is too long')
        .refine((val) => !sqlInjectionPattern.test(val), {
            message: "Invalid characters in email"
        }),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
});

export const registerSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email is too long')
        .refine((val) => !sqlInjectionPattern.test(val), {
            message: "Invalid characters in email"
        }),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }).optional().or(z.literal('')),
});

export const executeCodeSchema = z.object({
    source_code: z.string().max(10000, 'Code is too long'),
    language: z.enum([
        'python', 'python3', 'javascript', 'typescript',
        'php', 'c', 'cpp', 'java', 'csharp'
    ]),
    input: z.string().optional(),
});

export const paginationSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(20),
});

// route params validation
export const groupParamsSchema = z.object({
    hashedId: z.string().min(1, 'Group ID is required').max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid Group ID format'),
});

export const eventJoinSchema = z.object({
    inviteCode: z.string()
        .min(1, 'Invite code is required')
        .max(50, 'Invite code is too long')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid invite code format'),
});

export const submissionSchema = z.object({
    assignmentId: z.number().int().positive('Assignment ID must be a positive integer'),
    status: z.string().optional(),
    description: z.string().optional(),
    codingId: z.number().int().optional(),
    language: z.string().optional(),
});

export const programmingProblemSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    description: z.string().min(1, 'Description is required'),
    problemType: z.string().min(1, 'Problem type is required'),
    difficulty: z.coerce.number().int().min(1).max(5),
    timeLimit: z.coerce.number().int().min(1).max(60), // Max 60 sec
    category: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    codeTemplate: z.string().optional(),
    isPublic: z.boolean().optional(),
    allowTestCaseView: z.boolean().optional(),
    isDraft: z.boolean().optional(),
    sampleCases: z.array(z.any()).optional(), // Detailed validation can be added if needed
    testCases: z.array(z.any()).optional(),
});

export const assignmentSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    programmingProblemId: z.union([z.string(), z.number()]).optional(),
    selectProblemId: z.union([z.string(), z.number()]).optional(),
});
