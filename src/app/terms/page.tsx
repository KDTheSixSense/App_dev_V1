import React from 'react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white p-6 md:p-10 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">利用規約</h1>
        
        <p className="mb-6 text-gray-700 leading-relaxed">
          この利用規約（以下，「本規約」といいます。）は，Infopia（以下，「Infopia」といいます。）が提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。本サービスを利用する皆さま（以下，「ユーザー」といいます。）には，本規約の全文をお読みいただき，本規約に同意いただく必要があります。
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第1条（適用）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本規約は，本サービスの提供条件および本サービスの利用に関するInfopiaとユーザーとの間の権利義務関係を定めることを目的とし，ユーザーとInfopiaとの間の本サービスの利用に関わる一切の関係に適用されます。</li>
            <li>Infopiaが本サービス上で掲載する本サービス利用に関するルール，ガイドライン，ポリシー等（以下，「個別規定」といいます。）は，本規約の一部を構成するものとします。</li>
            <li>本規約の内容と，前項の個別規定その他の本規約外における本サービスの説明等とが異なる場合は，個別規定の規定が優先して適用されるものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第2条（定義）</h2>
          <p className="mb-2 text-gray-700">本規約において使用する以下の用語は，各々以下に定める意味を有するものとします。</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>「サービス利用契約」とは，本規約を契約条件としてInfopiaとユーザーの間で締結される，本サービスの利用契約を意味します。</li>
            <li>「知的財産権」とは，著作権，特許権，実用新案権，意匠権，商標権その他の知的財産権（それらの権利を取得し，またはそれらの権利につき登録等を出願する権利を含みます。）を意味します。</li>
            <li>「投稿データ」とは，ユーザーが本サービスを利用して投稿その他送信するコンテンツ（文章，画像，動画，プログラムコード，その他のデータを含みますがこれらに限りません。）を意味します。</li>
            <li>「生成AI」とは，本サービスの一部として提供される，人工知能技術を用いてコンテンツを生成する機能を意味します。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第3条（本サービスの内容および生成AIの利用）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスは，プログラミング学習支援，コミュニティ機能，およびこれらに関連するサービスを提供します。</li>
            <li>本サービスには，生成AIを利用した機能（コードの自動生成，解説の生成，チャットボット等を含みますがこれらに限りません。）が含まれる場合があります。</li>
            <li>
              ユーザーは，生成AIを利用するにあたり，以下の事項を承諾するものとします。
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>生成AIによる出力結果の正確性，完全性，有用性，適法性について，Infopiaは一切保証しないこと。</li>
                <li>生成AIの出力結果をユーザー自身の判断と責任において利用すること。</li>
                <li>生成AIに対して，個人情報，機密情報，または第三者の権利を侵害する情報を入力しないこと。</li>
              </ol>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第4条（会員登録）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスの利用を希望する者（以下，「登録希望者」といいます。）は，本規約を遵守することに同意し，かつInfopiaの定める一定の情報（以下，「登録事項」といいます。）をInfopiaの定める方法でInfopiaに提供することにより，Infopiaに対し，本サービスの利用の登録を申請することができます。</li>
            <li>Infopiaは，Infopiaの基準に従って，第1項に基づいて登録申請を行った登録希望者（以下，「登録申請者」といいます。）の登録の可否を判断し，Infopiaが登録を認める場合にはその旨を登録申請者に通知します。登録申請者の登録は，Infopiaが本項の通知を行ったことをもって完了したものとします。</li>
            <li>前項に定める登録の完了時に，サービス利用契約がユーザーとInfopiaの間に成立し，ユーザーは本サービスを本規約に従い利用することができるようになります。</li>
            <li>
              Infopiaは，登録申請者が，以下の各号のいずれかの事由に該当する場合は，登録および再登録を拒否することがあり，またその理由について一切開示義務を負いません。
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>Infopiaに提供した登録事項の全部または一部につき虚偽，誤記または記載漏れがあった場合</li>
                <li>未成年者，成年被後見人，被保佐人または被補助人のいずれかであり，法定代理人，後見人，保佐人または補助人の同意等を得ていなかった場合</li>
                <li>反社会的勢力等（暴力団，暴力団員，右翼団体，反社会的勢力，その他これに準ずる者を意味します。以下同じ。）である，または資金提供その他を通じて反社会的勢力等の維持，運営もしくは経営に協力もしくは関与する等反社会的勢力等との何らかの交流もしくは関与を行っているとInfopiaが判断した場合</li>
                <li>過去Infopiaとの契約に違反した者またはその関係者であるとInfopiaが判断した場合</li>
                <li>第11条に定める措置を受けたことがある場合</li>
                <li>その他，Infopiaが登録を適当でないと判断した場合</li>
              </ol>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第5条（個人情報の取扱い）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Infopiaは，本サービスの利用によって取得するユーザーの個人情報については，Infopia「プライバシーポリシー」に従い適切に取り扱うものとします。</li>
            <li>Infopiaは，ユーザーがInfopiaに提供した情報，データ等を，個人を特定できない形での統計的な情報として，Infopiaの裁量で，利用および公開することができるものとし，ユーザーはこれに異議を唱えないものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第6条（利用料金および支払方法）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは，本サービス利用の対価として，別途Infopiaが定め，本サービス上で表示する利用料金を，Infopiaが指定する支払方法によりInfopiaに支払うものとします。</li>
            <li>ユーザーが利用料金の支払を遅滞した場合，ユーザーは年14.6％の割合による遅延損害金をInfopiaに支払うものとします。</li>
            <li>本サービスの利用は現在無料である場合でも，Infopiaは将来的に本サービスの全部または一部を有料化する権利を留保します。有料化の際は，事前に本サービス上またはInfopiaの定める方法でユーザーに通知します。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第7条（返金ポリシー）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスの性質上，法令に別段の定めがある場合を除き，支払済みの利用料金の返金には一切応じないものとします。</li>
            <li>ユーザーが本サービスの利用期間中に退会，利用停止，またはその他の事由により本サービスの利用資格を喪失した場合であっても，日割計算等による返金は行いません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第8条（知的財産権）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスに関する知的財産権は全てInfopiaまたはInfopiaにライセンスを許諾している者に帰属しており，本規約に基づく本サービスの利用許諾は，本サービスに関するInfopiaまたはInfopiaにライセンスを許諾している者の知的財産権の使用許諾を意味するものではありません。</li>
            <li>ユーザーは，投稿データについて，自らが投稿その他送信することについての適法な権利を有していること，および投稿データが第三者の権利を侵害していないことについて，Infopiaに対し表明し，保証するものとします。</li>
            <li>ユーザーは，投稿データについて，Infopiaに対し，世界的，非独占的，無償，サブライセンス可能かつ譲渡可能な使用，複製，配布，派生著作物の作成，表示及び実行に関するライセンスを付与します。また，他のユーザーに対しても，本サービスを利用してユーザーが投稿その他送信した投稿データの使用，複製，配布，派生著作物の作成，表示及び実行することについての非独占的なライセンスを付与します。</li>
            <li>ユーザーは，InfopiaおよびInfopiaから権利を承継しまたは許諾された者に対して著作者人格権を行使しないことに同意するものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第9条（利用上のルール・禁止事項）</h2>
          <p className="mb-2 text-gray-700">ユーザーは，本サービスの利用にあたり，以下の各号のいずれかに該当する行為または該当するとInfopiaが判断する行為をしてはなりません。</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>法令に違反する行為または犯罪行為に関連する行為</li>
            <li>Infopia，本サービスの他のユーザーまたはその他の第三者に対する詐欺または脅迫行為</li>
            <li>公序良俗に反する行為</li>
            <li>Infopia，本サービスの他のユーザーまたはその他の第三者の知的財産権，肖像権，プライバシーの権利，名誉，その他の権利または利益を侵害する行為</li>
            <li>
              本サービスを通じ，以下に該当し，または該当するとInfopiaが判断する情報をInfopiaまたは本サービスの他のユーザーに送信すること
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>過度に暴力的または残虐な表現を含む情報</li>
                <li>コンピューター・ウィルスその他の有害なコンピューター・プログラムを含む情報</li>
                <li>Infopia，本サービスの他のユーザーまたはその他の第三者の名誉または信用を毀損する表現を含む情報</li>
                <li>過度にわいせつな表現を含む情報</li>
                <li>差別を助長する表現を含む情報</li>
                <li>自殺，自傷行為を助長する表現を含む情報</li>
                <li>薬物の不適切な利用を助長する表現を含む情報</li>
                <li>反社会的な表現を含む情報</li>
                <li>チェーンメール等の第三者への情報の拡散を求める情報</li>
                <li>他人に不快感を与える表現を含む情報</li>
              </ul>
            </li>
            <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
            <li>Infopiaが提供するソフトウェアその他のシステムに対するリバースエンジニアリングその他の解析行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>Infopiaのネットワークまたはシステム等への不正アクセス</li>
            <li>第三者に成りすます行為</li>
            <li>本サービスの他のユーザーのIDまたはパスワードを利用する行為</li>
            <li>Infopiaが事前に許諾しない本サービス上での宣伝，広告，勧誘，または営業行為</li>
            <li>本サービスの他のユーザーの情報の収集</li>
            <li>Infopia，本サービスの他のユーザーまたはその他の第三者に不利益，損害，不快感を与える行為</li>
            <li>反社会的勢力等への利益供与</li>
            <li>面識のない異性との出会いを目的とした行為</li>
            <li>前各号の行為を直接または間接に惹起し，または容易にする行為</li>
            <li>前各号の行為を試みること</li>
            <li>その他，Infopiaが不適切と判断する行為</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第10条（本サービスの提供の停止等）</h2>
          <p className="mb-2 text-gray-700">Infopiaは，以下のいずれかに該当する場合には，ユーザーに事前に通知することなく，本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスに係るコンピューター・システムの点検または保守作業を緊急に行う場合</li>
            <li>コンピューター，通信回線等の障害，誤操作，過度なアクセスの集中，不正アクセス，ハッキング等により本サービスの運営ができなくなった場合</li>
            <li>地震，落雷，火災，風水害，停電，天災地変などの不可抗力により本サービスの運営ができなくなった場合</li>
            <li>その他，Infopiaが停止または中断を必要と判断した場合</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第11条（規約違反への対応）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>
              Infopiaは，ユーザーが以下の各号のいずれかの事由に該当する場合，事前の通知または催告することなく，投稿データを削除し，当該ユーザーについて本サービスの利用を一時的に停止し，またはユーザーとしての登録を抹消することができます。
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>支払停止もしくは支払不能となり，または破産手続開始，民事再生手続開始，会社更生手続開始，特別清算開始若しくはこれらに類する手続の開始の申立てがあった場合</li>
                <li>6ヶ月以上本サービスの利用がない場合</li>
                <li>Infopiaからの問い合せその他の回答を求める連絡に対して30日間以上応答がない場合</li>
                <li>第4条第4項各号に該当する場合</li>
                <li>その他，Infopiaが本サービスの利用を適当でないと判断した場合</li>
              </ol>
            </li>
            <li>Infopiaは，本条に基づきInfopiaが行った行為によりユーザーに生じた損害について一切の責任を負いません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第12条（損害賠償）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは，本規約に違反することにより，または本サービスの利用に関連してInfopiaに損害を与えた場合，Infopiaに対しその損害を賠償しなければなりません。</li>
            <li>本サービスに関連してユーザーと他のユーザーまたは第三者との間において生じた取引，連絡，紛争等については，ユーザーが自己の責任によって解決するものとし，Infopiaは一切の責任を負いません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第13条（免責事項）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Infopiaは，本サービスがユーザーの特定の目的に適合すること，期待する機能・商品的価値・正確性・有用性を有すること，ユーザーによる本サービスの利用がユーザーに適用のある法令または業界団体の内部規則等に適合すること，継続的に利用できること，および不具合が生じないことについて，明示又は黙示を問わず何ら保証するものではありません。</li>
            <li>Infopiaは，本サービスに関してユーザーが被った損害につき，過去6ヶ月間にユーザーがInfopiaに支払った対価の金額を超えて賠償する責任を負わないものとし，また，付随的損害，間接損害，特別損害，将来の損害及び逸失利益にかかる損害については，賠償する責任を負わないものとします。ただし，Infopiaに故意または重大な過失がある場合はこの限りではありません。</li>
            <li>本サービスまたは本サービスに関連するウェブサイト上で，ユーザーまたは第三者が提供する情報（生成AIによる出力を含みます。）について，Infopiaはその正確性，完全性，適法性等を保証するものではありません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第14条（退会・解約）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは，Infopia所定の手続の完了により，本サービスから退会し，自己のユーザーとしての登録を抹消することができます。</li>
            <li>退会にあたり，Infopiaに対して負っている債務がある場合は，ユーザーは，Infopiaに対して負っている債務の一切について当然に期限の利益を失い，直ちにInfopiaに対して全ての債務の支払を行わなければなりません。</li>
            <li>退会後の利用者情報の取扱いについては，第5条の規定に従うものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第15条（反社会的勢力の排除）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>
              ユーザーは，現在，暴力団，暴力団員，暴力団員でなくなった時から5年を経過しない者，暴力団準構成員，暴力団関係企業，総会屋等，社会運動等標ぼうゴロまたは特殊知能暴力集団等，その他これらに準ずる者（以下，「暴力団員等」といいます。）に該当しないこと，および次の各号のいずれにも該当しないことを表明し，かつ将来にわたっても該当しないことを確約するものとします。
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>暴力団員等が経営を支配していると認められる関係を有すること</li>
                <li>暴力団員等が経営に実質的に関与していると認められる関係を有すること</li>
                <li>自己，自社もしくは第三者の不正の利益を図る目的または第三者に損害を加える目的をもってする等，不当に暴力団員等を利用していると認められる関係を有すること</li>
                <li>暴力団員等に対して資金等を提供し，または便宜を供与する等の関与をしていると認められる関係を有すること</li>
                <li>役員または経営に実質的に関与している者が暴力団員等と社会的に非難されるべき関係を有すること</li>
              </ol>
            </li>
            <li>
              ユーザーは，自らまたは第三者を利用して次の各号の一に該当する行為を行わないことを確約するものとします。
              <ol className="list-decimal pl-6 mt-2 space-y-1">
                <li>暴力的な要求行為</li>
                <li>法的な責任を超えた不当な要求行為</li>
                <li>取引に関して，脅迫的な言動をし，または暴力を用いる行為</li>
                <li>風説を流布し，偽計を用いまたは威力を用いてInfopiaの信用を毀損し，またはInfopiaの業務を妨害する行為</li>
                <li>その他前各号に準ずる行為</li>
              </ol>
            </li>
            <li>Infopiaは，ユーザーが，暴力団員等に該当する場合，前項各号のいずれかに該当する行為をした場合，または第1項の規定に基づく表明・確約に関して虚偽の申告をしたことが判明した場合には，何らの催告を要せずして，本サービスの利用停止，または登録を抹消することができるものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第16条（利用規約の変更）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Infopiaは，Infopiaが必要と認めた場合は，本規約を変更できるものとします。</li>
            <li>本規約を変更する場合，変更後の本規約の施行時期及び内容を本サービス上での掲示その他の適切な方法により周知し，またはユーザーに通知します。ただし，法令上ユーザーの同意が必要となるような内容の変更の場合は，Infopia所定の方法でユーザーの同意を得るものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第17条（通知または連絡）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本サービスに関する問い合わせその他ユーザーからInfopiaに対する連絡または通知，および本規約の変更に関する通知その他Infopiaからユーザーに対する連絡または通知は，Infopiaの定める方法で行うものとします。</li>
            <li>Infopiaが登録事項に含まれるメールアドレスその他の連絡先に連絡または通知を行った場合，ユーザーは当該連絡または通知を受領したものとみなします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第18条（権利義務の譲渡の禁止）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>ユーザーは，Infopiaの書面による事前の承諾なく，利用契約上の地位または本規約に基づく権利もしくは義務につき，第三者に対し，譲渡，移転，担保設定，その他の処分をすることはできません。</li>
            <li>Infopiaは本サービスにかかる事業を他社に譲渡した場合には，当該事業譲渡に伴い利用契約上の地位，本規約に基づく権利及び義務並びにユーザーの登録事項その他の顧客情報を当該事業譲渡の譲受人に譲渡することができるものとし，ユーザーは，かかる譲渡につき本項において予め同意したものとします。なお，本項に定める事業譲渡には，通常の事業譲渡のみならず，会社分割その他事業が移転するあらゆる場合を含むものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200">第19条（準拠法・裁判管轄）</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>本規約およびサービス利用契約の準拠法は日本法とします。</li>
            <li>本規約またはサービス利用契約に起因し，または関連する一切の紛争については，Infopiaの本店所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
          </ol>
        </section>
      </div>
    </div>
  );
}