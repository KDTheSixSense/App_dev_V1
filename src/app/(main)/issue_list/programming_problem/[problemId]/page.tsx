import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProblemByIdAction } from '@/lib/actions';
import ProblemClient from './ProblemClient';
import { detectThreatType } from '@/lib/waf';

interface PageProps {
    params: Promise<{ problemId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ProblemSolverPage = async (props: PageProps) => {
    const params = await props.params;
    const searchParams = await props.searchParams;

    // Security Check: WAF for Search Params
    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            let threat = detectThreatType(key);
            if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);

            if (typeof value === 'string') {
                threat = detectThreatType(value);
                if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
            } else if (Array.isArray(value)) {
                for (const item of value) {
                    threat = detectThreatType(item);
                    if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
                }
            }
        }
    }

    const problemId = params.problemId;
    const session = await getAppSession();
    const problem = await getProblemByIdAction(problemId);

    if (!problem) {
        notFound();
    }

    let userCredits = 0;
    let userPetStatus = null;

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                aiAdviceCredits: true,
                status_Kohaku: {
                    select: {
                        hungerlevel: true,
                        evolutionType: true,
                    }
                }
            }
        });
        if (user) {
            userCredits = user.aiAdviceCredits;
            userPetStatus = user.status_Kohaku;
        }
    }

    return (
        <ProblemClient
            initialProblem={problem}
            initialCredits={userCredits}
            initialPetStatus={userPetStatus}
        />
    );
};

export default ProblemSolverPage;