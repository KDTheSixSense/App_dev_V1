import { IronSession, IronSessionData, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from './session';

// APIルート用の型定義
export type ApiHandler = (
  req: NextRequest,
  session: IronSession<IronSessionData>
) => Promise<NextResponse | Response>;

/**
 * APIルートをラップして、セッションオブジェクトをハンドラに渡す関数
 * @param handler APIルートの実処理を行う関数
 * @returns ラップされたAPIルート
 */
export function withApiSession(handler: ApiHandler) {
  return async function (req: NextRequest): Promise<NextResponse | Response> {
    const session = await getIronSession<IronSessionData>(
      await cookies(),
      sessionOptions
    );
    return handler(req, session);
  };
}