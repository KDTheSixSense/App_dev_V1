# **使い方**  
  
1. VSCodeを開く  
  
2. 以下のリンクにアクセス  
    -[GitHub Clone Page](https://github.com/KDTheSixSense/App_dev_V1)  
  
3. git fork を自分のリポジトリとして作成  
  
4. fork版を作成したらgit clone する  
  
5. VSCode 開き Ctrl + Shift + P で git clone をクリックし、3で fork 版をクローンする  
  
6. git クローンし終えたら再度 Ctrl + Shift + P で 「開発コンテナー:キャッシュ無しでリビルドし、コンテナで再度開く」項目を選択

7. コンテナの準備が完了したらReactを使う為下のターミナルを開き、以下のコマンドを実行  
  
$ npx create-react-app login-app --template typescript  
  
8. 実行後、react-hook-form のインストールを行う  
  
$ npm install react-hook-form  
  
9. これも実行出来たら最後に以下のコマンドを実行
  
$ npm run dev  

10. これで開発環境は完了!  
以下のサイトにアクセスすることが出来ればNext.jsの起動は成功!  
http://localhost:3000  