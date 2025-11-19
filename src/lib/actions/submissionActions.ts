// lib/actions/submissionActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function returnSubmission(assignmentId: number, userId: number, groupId: string) {
  try {
    const submission = await prisma.submissions.findUnique({
      where: {
        assignment_id_userid: {
          assignment_id: assignmentId,
          userid: userId,
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    await prisma.submissions.update({
      where: {
        id: submission.id,
      },
      data: {
        status: '差し戻し',
      },
    });

    revalidatePath(`/group/${groupId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Failed to return submission:', error);
    return { success: false, message: 'Failed to return submission' };
  }
}
