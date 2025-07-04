//ログイン画面フォーム上で表示させる

//現状、エラーをアラート表示にしているが工程進めば

//クライアントコンポーネント
'use client';
import React from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from 'next/navigation';

//email/password　の型宣言
type Inputs = {
    email: string;
    password: string;
};


const Login = () => {

    const router = useRouter();

    //useFormフックの呼び出し const以下の関数受け取り
    const { register, handleSubmit, formState: { errors } } = useForm<Inputs>();
    const [loading, setLoading] = React.useState(false);

    //非同期関数
    const onSubmit = async(data: Inputs) => {
        console.log("送信データ:", data);
    // ここにAPI呼び出しや状態更新処理を書く
        //API通信の状態を示す
        setLoading(true);
    try {
        //POSTリクエストを/api/auth/loginに送信
        const res = await fetch('/api/auth/login', {
        method: 'POST',
        //JSON形式
        headers: { 'Content-Type': 'application/json' },
        //JSオブジェクトをJSON文字列変換
        body: JSON.stringify(data),
      });
      //レスポンスが成功ではない
      if (!res.ok) {
        throw new Error('ログイン失敗');
      }
      //JSONデータをJSオブジェクトに変換
      const result = await res.json();
      console.log('ログイン成功:', result);
      // ここに成功時の処理（例: トークン保存、ページ遷移）を追加

      // '/home'ページに遷移
      router.push('/home'); 

    } catch (error) {
      alert('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    } finally {
      setLoading(false);
    }
        //成功失敗でも必ず行う処理



    };

    //以下で画面表示するフォームの見た目を定義
    return (
        //Tailwind CSSを使用して見た目の変更・hookで入力チェック
        <div className="flex flex-col items-center justify-center h-screen">
            <form onSubmit={handleSubmit(onSubmit)} className="w-96 p-8 bg-white rounded-lg shadow-md">
                
                

                {/*見出しとラベル*/}
                <h1 className="mb-4 text-2xl font-medium text-gray-700">ログイン</h1>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
                    
                    {/*入力部分*/}
                    <input
                        //registerでライブラリの管理下に登録する
                            //今回は、emailという名前を設定
                        {...register("email", {

                            //以下内容は、入力値のチェックになる
                            //requiredは必須指定
                            required: "メールアドレスは必須です",
                            
                            //入力値が特定パターン(value)に一致するか/一致しない場合のメッセージ(message)
                            pattern: {
                                value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                                message: "このメールアドレスは無効です。",
                            },
                        })}
                        //メールアドレス専用指定
                        type="email"
                        //入力値が空の場合の例文
                        placeholder="mail@myservice.com"
                        
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {/*hookでエラーがでた場合のエラー内容*/}
                    {errors.email && (
                        <span className="text-sm text-red-600">{errors.email.message}</span>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">パスワード</label>
                    <input
                        {...register("password", {
                            required: "パスワードは必須です",
                            minLength: {
                                value: 4,
                                message: "パスワードは4文字以上でなくてはなりません",
                            },
                        })}
                        type="password"
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {errors.password && (
                        <span className="text-sm text-red-600">{errors.password.message}</span>
                    )}
                </div>

                {/*ログインボタン*/}
                <div className="flex justify-end">
                    <button
                        type="submit"disabled={loading}
                        className={`px-4 py-2 font-bold text-white rounded ${
                        loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'
                    }`}
                    >
                    {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </div>
                
                {/*新規登録への案内リンク*/}
                <div className="mt-4">
                    <span className="text-sm text-gray-600">初めてのご利用の方は</span>
                    <Link href="/auth/register" className="ml-1 text-sm font-bold text-blue-500 hover:text-blue-700">
                        こちら
                    </Link>
                </div>

                {/*パスワード変更画面へのリンク*/}
                <div className="mt-4">
                    <span className="text-sm text-gray-600">パスワードをお忘れの方は</span>
                    <Link href="/auth/mail" className="ml-1 text-sm font-bold text-blue-500 hover:text-blue-700">
                        こちら
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
