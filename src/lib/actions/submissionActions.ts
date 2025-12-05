// lib/actions/submissionActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function returnSubmission(assignmentId: number, userId: string, groupId: string) {
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

export async function returnMultipleSubmissions(assignmentId: number, userIds: string[], groupId: string) {
  try {
    if (userIds.length === 0) {
      return { success: true }; // No users to process
    }

    await prisma.submissions.updateMany({
      where: {
        assignment_id: assignmentId,
        userid: {
          in: userIds,
        },
        status: '提出済み', //念のため提出済みのものだけを対象にする
      },
      data: {
        status: '差し戻し',
      },
    });

    revalidatePath(`/group/${groupId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Failed to return multiple submissions:', error);
    return { success: false, message: 'Failed to return multiple submissions' };
  }
}

