import React from 'react';

/**
 * プライバシーポリシーページ
 * 
 * ユーザーの個人情報の取り扱いに関する方針を表示します。
 */
export default function PrivacyPolicyPage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white selection:bg-cyan-500 selection:text-slate-900 
                   bg-center bg-cover bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/Infopia_Login_Ragister_Background.png')" }}
    >
      {/* --- 背景の装飾 (オーバーレイ) --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-70"></div>
      </div>

      {/* --- コンテンツラッパー (z-10) --- */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        {/* --- ヘッダーロゴ (中央配置) --- */}
        <header className="flex justify-center mb-10">
          <a href="/" className="relative h-16 w-48">
            <img
              src="/images/infopia_logo.png"
              alt="Infopia Logo"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </a>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10 backdrop-blur-xl shadow-2xl text-slate-200">
          <h1 className="text-3xl font-bold mb-8 text-center text-white">プライバシーポリシー</h1>

          <p className="mb-6 leading-relaxed">
            Infopia（以下，「Infopia」といいます。）は，本ウェブサイト上で提供するサービス（以下，「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第1条（個人情報保護に関する基本方針）</h2>
            <p>
              Infopiaは，個人情報の重要性を認識し，個人情報を保護することが社会的責務であると考え，個人情報に関する法令及び社内規程等を遵守し，Infopiaで取扱う個人情報の取得，利用，管理を適正に行います。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第2条（定義）</h2>
            <p>
              「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報及び容貌，指紋，声紋にかかるデータ，及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第3条（チーム情報）</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>チーム名：Infopia</li>
              <li>住所：[※住所を記載してください]</li>
              <li>代表者氏名：[※代表者氏名を記載してください]</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第4条（個人情報の取得方法）</h2>
            <p>
              Infopiaは，ユーザーが利用登録をする際に氏名，生年月日，住所，電話番号，メールアドレス，銀行口座番号，クレジットカード番号，運転免許証番号などの個人情報をお尋ねすることがあります。また，ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を,Infopiaの提携先（情報提供元，広告主，広告配信先などを含みます。以下，｢提携先｣といいます。）などから収集することがあります。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第5条（個人情報の利用目的）</h2>
            <p className="mb-2">Infopiaが個人情報を収集・利用する目的は，以下のとおりです。</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Infopiaサービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>ユーザーが利用中のサービスの新機能，更新情報，キャンペーン等及びInfopiaが提供する他のサービスの案内のメールを送付するため</li>
              <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更，削除，ご利用状況の閲覧を行っていただくため</li>
              <li>有料サービスにおいて，ユーザーに利用料金を請求するため</li>
              <li>上記の利用目的に付随する目的</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第6条（個人データの安全管理措置）</h2>
            <p>
              Infopiaは，個人情報を正確かつ最新の内容に保つよう努め，不正なアクセス・改ざん・漏えい・滅失及び毀損から保護するため，全従業員及び役員に対して教育研修を実施しています。また，個人情報保護規程を設け，現場での管理についても定期的に点検を行っています。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第7条（個人データの共同利用）</h2>
            <p>
              Infopiaは，ユーザーの個人データを共同利用する場合，あらかじめ共同利用する個人データの項目，共同利用する者の範囲，利用する者の利用目的および当該個人データの管理について責任を有する者の氏名または名称を通知し，またはユーザーが容易に知り得る状態に置きます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第8条（個人データの第三者提供）</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Infopiaは，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。ただし，個人情報保護法その他の法令で認められる場合を除きます。
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって，本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                  <li>
                    予め次の事項を告知あるいは公表し，かつInfopiaが個人情報保護委員会に届出をしたとき
                    <ol className="list-decimal pl-6 mt-1 space-y-1">
                      <li>利用目的に第三者への提供を含むこと</li>
                      <li>第三者に提供されるデータの項目</li>
                      <li>第三者への提供の手段または方法</li>
                      <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                      <li>本人の求めを受け付ける方法</li>
                    </ol>
                  </li>
                </ol>
              </li>
              <li>
                前項の定めにかかわらず，次に掲げる場合には，当該情報の提供先は第三者に該当しないものとします。
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Infopiaが利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                  <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                  <li>個人情報を特定の者との間で共同して利用する場合であって，その旨並びに共同して利用される個人情報の項目，共同して利用する者の範囲，利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について，あらかじめ本人に通知し，または本人が容易に知り得る状態に置いた場合</li>
                </ol>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第9条（個人情報の開示・訂正等の手続き）</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>ユーザーは，Infopiaの保有する自己の個人情報が誤った情報である場合には，Infopiaが定める手続きにより，Infopiaに対して個人情報の開示，訂正，追加または削除（以下，「訂正等」といいます。）を請求することができます。</li>
              <li>Infopiaは，ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の開示または訂正等を行うものとします。</li>
              <li>Infopiaは，前項の規定に基づき開示・訂正等を行った場合，または開示・訂正等を行わない旨の決定をしたときは遅滞なく，これをユーザーに通知します。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第10条（個人情報の利用停止等）</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Infopiaは，本人から，個人情報が，利用目的の範囲を超えて取り扱われているという理由，または不正の手段により取得されたものであるという理由により，その利用の停止または消去（以下，「利用停止等」といいます。）を求められた場合には，遅滞なく必要な調査を行います。</li>
              <li>前項の調査結果に基づき，その請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の利用停止等を行います。</li>
              <li>Infopiaは，前項の規定に基づき利用停止等を行った場合，または利用停止等を行わない旨の決定をしたときは，遅滞なく，これをユーザーに通知します。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第11条（SSLセキュリティについて）</h2>
            <p>
              InfopiaのWebサイトはSSLに対応しており，WebブラウザとWebサーバーとの通信を暗号化しています。ユーザーが入力する氏名や住所，電話番号などの個人情報は自動的に暗号化されるため，万が一，送信データが第三者に傍受された場合でも，内容が盗み取られる心配はありません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第12条（Cookie（クッキー）について）</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>InfopiaのWebサイトでは，Cookie（クッキー）と呼ばれる技術を利用しています。Cookieとは，WebサイトからユーザーのWebブラウザに送信される小さなデータファイルのことで，ユーザーが再度Webサイトを訪れた際に，より便利に利用していただくために使用されます。</li>
              <li>ユーザーは，Webブラウザの設定を変更することにより，Cookieの受け取りを拒否することができます。ただし，Cookieを拒否した場合，本サービスの一部が正常に機能しない可能性があります。</li>
              <li>Infopiaは，本サービスの利用状況を分析し，サービスの改善に役立てるために，Google Analytics等のアクセス解析ツールを利用する場合があります。これらのツールは，トラフィックデータの収集のためにCookieを使用しますが，このデータは匿名で収集されており，個人を特定するものではありません。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-cyan-400">第13条（お問い合わせ窓口）</h2>
            <p className="mb-2">本ポリシーに関するお問い合わせは，下記の窓口までお願いいたします。</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>チーム名：Infopia</li>
              <li>Eメールアドレス：ainfopiaf6@gmail.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}