承知いたしました。GoogleのOAuth 2.0サービスを利用して、Node.js（バックエンド）とReact（フロントエンド）で「Googleでログイン」機能を実装する流れですね。

前回のお話の通り、これはOAuth 2.0の「クライアント」側を実装する作業になります。

全体の流れは以下のようになります。

Google側: Google Cloud Consoleでプロジェクトを設定し、「クライアントID」と「クライアントシークレット」を取得します。

Node.js側: Passport.js というライブラリを使い、Googleからの認証コールバックを受け取り、セッション（またはJWT）を発行するAPIエンドポイントを作成します。

React側: 「Googleでログイン」ボタンを設置し、クリックされたらNode.jsのAPIを呼び出します。

ステップ1：Google Cloud Consoleでの設定
まず、Googleに「こういうWebサイトがGoogleログインを使います」と登録する必要があります。

Google Cloud Consoleにアクセスします。

新しいプロジェクトを作成するか、既存のプロジェクトを選択します。

左側のメニューで「APIとサービス」 > 「有効なAPIとサービス」に移動します。

「+ APIとサービスの有効化」をクリックし、「Google People API」（またはGoogle+ APIなど、プロフィール情報を取得するAPI）を検索して有効にします。

次に、左側のメニューで「APIとサービス」 > 「認証情報」に移動します。

「+ 認証情報を作成」 > 「OAuth 2.0 クライアント ID」を選択します。

「アプリケーションの種類」で「ウェブ アプリケーション」を選択します。

「名前」を入力します（例: My App - Web）。

重要な設定:

承認済みのリダイレクト URI: ここに、Googleが認証後にユーザーをリダイレクトさせるNode.js（バックエンド）のURLを指定します。

例: http://localhost:8080/api/auth/google/callback

（8080はご自身のNode.jsサーバーのポート番号に合わせてください）

「作成」をクリックすると、クライアントIDとクライアントシークレットが表示されます。これは絶対に漏らしてはいけない、特にシークレットは厳重に管理する必要があります。

ステップ2：Node.js (バックエンド) の実装
Passport.js というライブラリを使うのが最も標準的で簡単です。express を使っている前提で説明します。

1. 必要なライブラリをインストールします。

Bash

# passport本体と、Google用の戦略（Strategy）
npm install passport passport-google-oauth20

# セッション管理用（JWTを使う場合は jsonwebtoken など）
npm install express-session
2. Node.js (Express) サーバーを設定します。

JavaScript

// server.js

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session'); // またはJWT

const app = express();

// ----- セッションの設定 (JWTの場合はここは不要) -----
app.use(session({
    secret: 'YOUR_VERY_SECRET_KEY', // 本番では環境変数から読み込む
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// ユーザー情報をセッションに保存
passport.serializeUser((user, done) => {
    done(null, user.id); // ここでは例としてユーザーIDを保存
});

// セッションからユーザー情報を復元
passport.deserializeUser((id, done) => {
    // 実際にはここでDBからユーザーを検索する
    // const user = User.findById(id); 
    const user = { id: id, name: 'Test User' }; // 仮のユーザー
    done(null, user);
});
// --------------------------------------------------


// ----- PassportのGoogle戦略を設定 -----
passport.use(new GoogleStrategy({
    clientID: 'YOUR_CLIENT_ID_FROM_GOOGLE',       // ステップ1で取得したID
    clientSecret: 'YOUR_CLIENT_SECRET_FROM_GOOGLE', // ステップ1で取得したシークレット
    callbackURL: 'http://localhost:8080/api/auth/google/callback' // ステップ1で設定したURI
  },
  (accessToken, refreshToken, profile, done) => {
    // Googleからプロフィール情報が返される
    console.log('Google Profile:', profile);

    // ここで、profile.id や profile.emails[0].value を使って
    // 1. データベース内のユーザーを検索
    // 2. ユーザーがいなければ、新規登録
    // 3. データベースのユーザー情報を `done` に渡す
    
    // 仮の処理: 取得した情報をそのままdoneに渡す
    const user = { 
        id: profile.id, 
        displayName: profile.displayName 
    };
    return done(null, user); // 認証成功、シリアライズ処理へ
  }
));


// ----- 認証用のルーティング -----

// 1. ログイン開始エンドポイント (Reactから叩かれる)
app.get('/api/auth/google',
  passport.authenticate('google', { 
      scope: ['profile', 'email'] // Googleに要求する情報
  })
);

// 2. Googleからのコールバックエンドポイント (ステップ1で設定したURI)
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }), // 失敗時はReactのログイン画面へ
  (req, res) => {
    // 認証成功！
    // passport.serializeUserが呼ばれ、セッションが確立される
    
    // 成功したらReactアプリのダッシュボードなどにリダイレクト
    res.redirect('http://localhost:3000/dashboard'); 
  }
);

// 3. ログイン状態を確認するエンドポイント (Reactが使う)
app.get('/api/profile', (req, res) => {
    if (req.isAuthenticated()) { // passportがセッションをチェック
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// 4. ログアウト
app.get('/api/logout', (req, res) => {
    req.logout((err) => { // req.logoutはv0.6.0以降非同期
        if (err) { return next(err); }
        res.redirect('http://localhost:3000/'); // トップページへ
    });
});


app.listen(8080, () => {
    console.log('Node.js backend running on http://localhost:8080');
});
注意点（JWTを使う場合）: ユーザーの技術スタック（Kubernetes, Next.js）を考えると、ステートレスなJWTを好まれるかもしれません。 その場合は、express-session の代わりに、コールバック（/api/auth/google/callback）で認証が成功した際に、jsonwebtoken ライブラリを使ってJWTを生成し、httpOnly のCookieにセットしてReactアプリにリダイレクトします。

ステップ3：React (フロントエンド) の実装
1. ログインボタンの作成

Reactコンポーネントに、「Googleでログイン」ボタンを作ります。このボタンは、GoogleのURLを直接叩くのではなく、ステップ2で作成したNode.jsのログイン開始エンドポイントを叩きます。

JavaScript

// src/components/LoginButton.js

import React from 'react';

function LoginButton() {
  const handleLogin = () => {
    // Node.jsサーバーの /api/auth/google エンドポイントにリダイレクトさせる
    // これにより、サーバーサイドのPassport.jsが起動する
    window.location.href = 'http://localhost:8080/api/auth/google';
  };

  return (
    <button onClick={handleLogin}>
      Googleでログイン
    </button>
  );
}

export default LoginButton;
2. ログイン状態の管理 (Context APIの使用例)

アプリ全体でログイン状態を共有するために、Contextを使うと便利です。

JavaScript

// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios'; // axiosをインストール: npm install axios

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // アプリ起動時に /api/profile を叩いてログイン状態を確認
        const checkAuth = async () => {
            try {
                // Cookieは自動で送信される
                const res = await axios.get('http://localhost:8080/api/profile');
                setUser(res.data.user);
            } catch (error) {
                console.log('Not authenticated');
                setUser(null);
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const value = {
        user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
3. アプリケーションへの適用

index.js や App.js で AuthProvider をラップし、ダッシュボード画面などで useAuth フックを使います。

JavaScript

// src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginButton from './components/LoginButton';

// ログインが必要なルートを保護するコンポーネント
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
    const { user } = useAuth();
    return (
        <div>
            <h1>ようこそ, {user.displayName} さん</h1>
            <a href="http://localhost:8080/api/logout">ログアウト</a>
        </div>
    );
};

const LoginPage = () => {
    return (
        <div>
            <h2>ログインしてください</h2>
            <LoginButton />
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<h2>Home</h2>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
この流れで、ReactとNode.jsを連携させたGoogle OAuth 2.0ログインが実装できるはずです。