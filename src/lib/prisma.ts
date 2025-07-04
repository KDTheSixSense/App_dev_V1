import { PrismaClient } from '@prisma/client';

// PrismaClientの型を定義
type PrismaClientSingleton = PrismaClient;

// グローバルオブジェクトにPrismaClientのインスタンスを格納するためのキーを定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// prismaインスタンスが存在すればそれを使い、なければ新しく作成する
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 開発環境でのみ、実行されたクエリをログに出力するように設定するとデバッグに便利です
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 開発環境でのみ、グローバルオブジェクトにprismaインスタンスを格納する
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;