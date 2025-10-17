import { IronSession, IronSessionData, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from './session';

// APIルート用の型定義
export type ApiHandler = (
  req: NextRequest, 
  session: IronSession<IronSessionData>,
  // params を受け取れるように context を追加
  context: { params: { [key: string]: string | string[] | undefined } }
) => Promise<NextResponse | Response>;

/**
 * APIルートをラップして、セッションオブジェクトをハンドラに渡す関数
 * @param handler APIルートの実処理を行う関数
 * @returns ラップされたAPIルート
 */
export function withApiSession(handler: ApiHandler) {
  // context を受け取れるように引数を変更
  return async function (req: NextRequest, context: { params: { [key: string]: string } }): Promise<NextResponse | Response> {
    const session = await getIronSession<IronSessionData>(
      await cookies(),
      sessionOptions
    );
    return handler(req, session, context);
  };
}