// lib/actions/submissionActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

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
// Helper to detect language from filename
function detectLanguage(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.py': return 'Python';
    case '.js': return 'JavaScript';
    case '.ts': return 'TypeScript';
    case '.java': return 'Java';
    case '.c': return 'C';
    case '.cpp': return 'C++';
    case '.cs': return 'C#';
    case '.html': return 'HTML';
    case '.css': return 'CSS';
    case '.php': return 'PHP';
    case '.rb': return 'Ruby';
    case '.go': return 'Go';
    case '.rs': return 'Rust';
    case '.sql': return 'SQL';
    case '.md': return 'Markdown';
    case '.json': return 'JSON';
    default: return 'Text / Unknown';
  }
}


// Helper to detect language from content
function detectLanguageFromContent(content: string): string {
  // Simple heuristic based on keywords
  // Java
  if (content.includes('public class ') || content.includes('System.out.println') || content.includes('import java.')) {
    return 'Java';
  }
  // Python
  if ((content.includes('def ') && content.includes(':')) || content.includes('import ') || content.includes('print(')) {
    // Basic check to distinguish from just text that happens to have "import"
    if (!content.includes(';') && !content.includes('{')) {
      return 'Python';
    }
  }
  // C / C++
  if (content.includes('#include <stdio.h>') || content.includes('#include <iostream>') || content.includes('int main(')) {
    return 'C/C++';
  }
  // JavaScript / TypeScript
  if (content.includes('console.log') || content.includes('function ') || content.includes('const ') || content.includes('let ')) {
    if (content.includes(': string') || content.includes(': number') || content.includes('interface ')) {
      return 'TypeScript';
    }
    return 'JavaScript';
  }

  // Default fallback
  return 'Programming Code (Unknown)';
}

export async function getSubmissionContent(submissionId: number) {
  try {
    const submission = await prisma.submissions.findUnique({
      where: { id: submissionId },
      include: {
        user: { select: { username: true } },
        assignment: { select: { programmingProblemId: true } } // プログラミング課題か判定するために追加
      }
    });

    if (!submission) {
      return { success: false, message: '提出が見つかりません' };
    }

    let content = '';
    let fileName = 'テキスト提出';
    let language = 'Text';

    // DBに保存された言語があればそれを使用
    if (submission.language) {
      language = submission.language;
    }

    // file_pathがある場合はファイルから読み込む
    if (submission.file_path) {
      // Absolute path construction:
      // IMPORTANT: In production, ensure this path resolution is secure and correct.
      // The stored file_path is like "/uploads/xxx.ext".
      const relativePath = submission.file_path.startsWith('/') ? submission.file_path.slice(1) : submission.file_path;
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      fileName = path.basename(fullPath);

      // DBに言語指定がない場合のみ推論
      if (!submission.language) {
        language = detectLanguage(fileName);
        // If detection from filename is generic/unknown, try content
        if (language === 'Text / Unknown') {
          // We need content loaded first to do this, so we might need to move this logic after reading file
          // But actually we read file later. Let's wait until we read the file.
        }
      }

      try {
        content = await fs.readFile(fullPath, 'utf8');
      } catch (readError) {
        console.error('File read error:', readError);
        if (submission.description) {
          content = `[ファイル読み込みエラー: ${path.basename(fullPath)}]\n\n(説明文)\n${submission.description}`;
        } else {
          const errorMessage = readError instanceof Error ? readError.message : String(readError);
          return { success: false, message: `ファイルの読み込みに失敗しました: ${errorMessage}` };
        }
      }

      // If language is still unknown/text after filename detection, try content detection
      if (!submission.language && (language === 'Text / Unknown' || language === 'Text')) {
        const detectedFromContent = detectLanguageFromContent(content);
        if (detectedFromContent !== 'Programming Code (Unknown)') {
          language = detectedFromContent;
        }
      }
    } else {
      // file_pathがない場合はdescriptionを返す
      content = submission.description || '(内容なし)';
      // プログラミング課題の場合はPythonの可能性が高いが、断定はできないためCodeとする
      // APIのデフォルトがPythonなので、Python (Estimated) とすることも考えられるが、
      // ユーザーが明示的に保存していない限り Text / Code とする
      if (submission.assignment.programmingProblemId) {
        if (!submission.language) {
          language = detectLanguageFromContent(content);
          if (language === 'Programming Code (Unknown)') {
            language = 'Programming Code (Python?)'; // Still fallback to Python hint if really unsure but likely code
          }
        }
      } else {
        if (!submission.language) {
          language = 'Text';
        }
      }
    }

    return {
      success: true,
      data: {
        content,
        submittedAt: submission.submitted_at,
        username: submission.user.username,
        fileName,
        language
      }
    };

  } catch (error) {
    console.error('Failed to get submission content:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `サーバーエラーが発生しました: ${errorMessage}` };
  }
}

