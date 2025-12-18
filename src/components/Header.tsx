//components/Header.tsx

'use client';

import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image'; // Imageコンポーネントをインポート
import { useSearchParams } from 'next/navigation';
// Link, Image, useRouter はNext.js固有のため削除
import { getEvolvedImageSrc, SubjectProgress } from './kohakuUtils';
import type { User, Status_Kohaku } from '@prisma/client';

type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
  progresses?: {
    level: number;
    subject: {
      name: string;
    };
  }[];
};

type HeaderProps = {
  userWithPet: UserWithPetStatus | null; // ユーザー情報を受け取る
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  subjectProgress?: SubjectProgress[]; // 進化判定用に科目の進捗を受け取る
};

type PetDisplayStatus = {
  hungerlevel: number;
  icon: string; // undefinedの可能性を排除
  colorClass?: string;
};

const MAX_HUNGER = 200; // 満腹度の最大値

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/Kohaku/kohaku-full.png',      // 満腹の画像
      suffix: 'smile',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/Kohaku/kohaku-normal.png',    // 普通の画像
      suffix: 'base',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/Kohaku/kohaku-hungry.png',    // 空腹の画像
      suffix: 'cry',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      icon: '/images/Kohaku/kohaku-starving.png',  // 死にかけの画像
      suffix: 'death',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }
};

export default function Header({ userWithPet, isMenuOpen, setIsMenuOpen, subjectProgress }: HeaderProps) {
  const user = userWithPet; // 既存のコードとの互換性のため
  const searchParams = useSearchParams();

  // 1. ランク(level)と経験値(xp)のstate
  const [rank, setRank] = useState(() => userWithPet?.level ?? 1);
  const [xp, setXp] = useState(() => userWithPet?.xp ?? 0);
  // 2. 連続ログイン日数のstate
  const [continuousLogin, setContinuousLogin] = useState(() => userWithPet?.continuouslogin ?? 0);

  // userWithPet内のprogressesからSubjectProgress形式に変換する
  // これにより、Headerが表示するユーザーごとの進化状態を正しく反映できる
  const effectiveSubjectProgress = React.useMemo(() => {
    if (userWithPet?.progresses && userWithPet.progresses.length > 0) {
      return userWithPet.progresses.map((p) => ({
        subjectName: p.subject.name,
        level: p.level,
      }));
    }
    return subjectProgress;
  }, [userWithPet, subjectProgress]);

  // ランク進捗の計算
  const requiredXpForNextLevel = 1000;
  const currentXpInLevel = xp % requiredXpForNextLevel;
  const progressPercentage = (currentXpInLevel / requiredXpForNextLevel) * 100;

  const headerRef = useRef<HTMLElement>(null);

  // ヘッダーの高さを取得してCSS変数を設定する
  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }
  }, []); // コンポーネントのマウント時に一度だけ実行

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // メニューの外側をクリックしたら閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 3. ペット情報のstate
  const [petStatus, setPetStatus] = useState<PetDisplayStatus | null>(() => {
    const initialStatus = userWithPet?.status_Kohaku;
    const currentLevel = userWithPet?.level ?? 1;
    const isEvolving = searchParams.get('evolution') === 'true';

    if (initialStatus) {
      const displayState = getPetDisplayState(initialStatus.hungerlevel);

      // レベル30以上なら進化画像を優先する（ただし進化演出中は通常画像を表示）
      let icon = displayState.icon;
      // DBに保存された進化タイプがある場合
      if ((initialStatus as any).evolutionType) {
        icon = `/images/evolution/${(initialStatus as any).evolutionType}-${displayState.suffix}.png`;
      } else if (currentLevel >= 30 && !isEvolving) {
        const evolvedBase = getEvolvedImageSrc(effectiveSubjectProgress);
        // レベル30以上なら、通常画像が返ってきても進化画像(A-A)に強制変換して維持する
        if (evolvedBase === '/images/Kohaku/kohaku-normal.png') {
           icon = `/images/evolution/A-A-${displayState.suffix}.png`;
        } else 
        if (evolvedBase !== '/images/Kohaku/kohaku-normal.png') {
          icon = evolvedBase.replace('base.png', `${displayState.suffix}.png`);
        }
      }

      return {
        hungerlevel: initialStatus.hungerlevel,
        icon: icon,
        colorClass: displayState.colorClass
      };
    }
    // ユーザーはいるがペット情報がない場合 (フォールバック)
    if (userWithPet) {
      const displayState = getPetDisplayState(MAX_HUNGER);
      console.log("[Header Debug] Initial petStatus (fallback for no status_Kohaku):", { hungerlevel: MAX_HUNGER, ...displayState });
      return { hungerlevel: MAX_HUNGER, ...displayState };
    }
    console.log("[Header Debug] Initial petStatus (no userWithPet): null");
    return null;
  });

  // Props (userWithPet, subjectProgress) が更新されたら State を同期する
  // これにより router.refresh() 後の新しい進化画像が反映されます
  useEffect(() => {
    if (userWithPet?.status_Kohaku) {
      const { hungerlevel } = userWithPet.status_Kohaku;
      const displayState = getPetDisplayState(hungerlevel);
      const currentLevel = userWithPet.level;
      
      // 進化演出中かどうかはURLパラメータで判断
      const isEvolving = searchParams.get('evolution') === 'true';

      let icon = displayState.icon;
      // DBに保存された進化タイプがある場合
      if ((userWithPet.status_Kohaku as any).evolutionType) {
        icon = `/images/evolution/${(userWithPet.status_Kohaku as any).evolutionType}-${displayState.suffix}.png`;
      } else if (currentLevel >= 30 && !isEvolving) {
        const evolvedBase = getEvolvedImageSrc(effectiveSubjectProgress);
        // レベル30以上なら、通常画像が返ってきても進化画像(A-A)に強制変換して維持する
        if (evolvedBase === '/images/Kohaku/kohaku-normal.png') {
           icon = `/images/evolution/A-A-${displayState.suffix}.png`;
        } else 
        if (evolvedBase !== '/images/Kohaku/kohaku-normal.png') {
          icon = evolvedBase.replace('base.png', `${displayState.suffix}.png`);
        }
      }

      setPetStatus({
        hungerlevel,
        icon,
        colorClass: displayState.colorClass
      });
      
      // 他のステータスも同期
      setRank(userWithPet.level);
      setXp(userWithPet.xp);
      setContinuousLogin(userWithPet.continuouslogin ?? 0);
    }
  }, [userWithPet, effectiveSubjectProgress, searchParams]);

  // 4. ファビコンをペットのアイコンに動的に変更する処理（強化版）
  useEffect(() => {
    if (!petStatus?.icon) return;

    const updateFavicon = (url: string) => {
      // 1. 既存のアイコンタグ（rel="icon" または rel="shortcut icon"）をすべて探す
      const links = document.querySelectorAll("link[rel*='icon']");

      // 2. 既存のタグがあれば、そのhrefを更新する
      links.forEach((link) => {
        (link as HTMLLinkElement).href = url;
      });

      // 3. もしタグが一つも見つからなかった場合（念のため）、新しく作る
      if (links.length === 0) {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = url;
        document.head.appendChild(newLink);
      }
    };

    updateFavicon(petStatus.icon);

  }, [petStatus]); // petStatus (icon) が変わるたびに実行される

  // 4. ペットのステータスをAPIから再取得して、Stateを更新する関数
  // (useCallbackでラップ)
  const refetchPetStatus = useCallback(async (isPeriodicCheck: boolean = false) => {
    console.log("[Header Debug] refetchPetStatus called.");
    try {
      const res = await fetch('/api/pet/status', { cache: 'no-store' }); // キャッシュを無効化
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const displayState = getPetDisplayState(data.hungerlevel);
          const isEvolving = searchParams.get('evolution') === 'true';
          // APIレスポンスにsubjectProgressが含まれていると仮定、もしくはpropsの値を使用
          // ※API側もsubjectProgressを返すように修正が必要な場合があります
          let icon = displayState.icon;
          // DBに保存された進化タイプがある場合
          if (data.evolutionType) {
            icon = `/images/evolution/${data.evolutionType}-${displayState.suffix}.png`;
          } else if (data.level >= 30 && !isEvolving) {
            if (!effectiveSubjectProgress || effectiveSubjectProgress.length === 0) {
              console.warn("[Header Debug] Level is >= 30 but subjectProgress is missing. Evolution image cannot be determined.");
            }
            const evolvedBase = getEvolvedImageSrc(effectiveSubjectProgress);
            // レベル30以上なら、通常画像が返ってきても進化画像(A-A)に強制変換して維持する
            if (evolvedBase === '/images/Kohaku/kohaku-normal.png') {
               icon = `/images/evolution/A-A-${displayState.suffix}.png`;
            } else 
            if (evolvedBase !== '/images/Kohaku/kohaku-normal.png') {
              icon = evolvedBase.replace('base.png', `${displayState.suffix}.png`);
            }
          }

          let hungerLevelChanged = false;
          setPetStatus(prevStatus => {
            if (prevStatus?.hungerlevel !== data.hungerlevel) {
              hungerLevelChanged = true;
            }
            return {
              hungerlevel: data.hungerlevel,
              icon: icon,
              colorClass: displayState.colorClass
            };
          });

          setRank(data.level ?? 1);
          setXp(data.xp ?? 0);
          setContinuousLogin(data.continuouslogin ?? 0);

          // 定期チェックで満腹度が変わっていたら、イベントを発火
          if (isPeriodicCheck && hungerLevelChanged) {
            console.log("[Header Debug] Hunger level changed on periodic check. Dispatching event.");
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
          }
        }
      } else {
        console.error("[Header Debug] Failed to fetch pet status. Response not OK:", res.status, await res.text());
      }
    } catch (error) {
      console.error("[Header Debug] ペット情報の再取得に失敗:", error);
    }
  }, [effectiveSubjectProgress, searchParams]); // subjectProgressが変わったら再計算できるように依存配列に追加

  // レンダリング直前にpetStatus.iconの値をログ出力
  console.log("[Header Debug] petStatus.icon before img tag:", petStatus?.icon);
  console.log("[Header Debug] subjectProgress in Header:", effectiveSubjectProgress);

  useEffect(() => {
    // ページ読み込み時にも最新の情報を取得
    if (userWithPet) { // ログインしている場合のみ
      const timerId = setTimeout(() => {
        refetchPetStatus();
      }, 500); // 500ms遅延実行

      // addEventListener 用のラッパー関数を定義
      const handlePetStatusUpdate = () => {
        refetchPetStatus(false); // isPeriodicCheck = false
      };

      // ラッパー関数をリスナーに登録
      window.addEventListener('petStatusUpdated', handlePetStatusUpdate);

      // 満腹度減少を同期間隔タイマー（1分ごと）
      const intervalId = setInterval(() => {
        if (userWithPet) {
          refetchPetStatus(true); // 定期チェックであることを示すフラグを立てる
        }
      }, 60000); // 60000ms = 1分

      // コンポーネントが不要になった時に、イベントリスナーとタイマーを解除
      return () => {
        clearTimeout(timerId); // 遅延実行タイマーを解除
        // ラッパー関数を解除
        window.removeEventListener('petStatusUpdated', handlePetStatusUpdate);
        clearInterval(intervalId); // 定期実行タイマーを解除
      };
    }
  }, [userWithPet, refetchPetStatus, searchParams]); // 依存配列に refetchPetStatus を追加

  // ログアウト処理を行う非同期関数
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('ログアウトに失敗しました');
      }
      // router.pushの代わりに、標準の画面遷移を使用
      window.location.href = '/auth/login';
    } catch (error) { // ★★★ catchブロックの括弧{}を修正しました ★★★
      console.error(error);
      // alertは使用しない方が良いため、コンソールエラーに留めます
    }
  };

  // ナビゲーションボタンのデータを配列で管理
  const navItems = [
    { href: '/home', icon: '/images/home.png', label: 'ホーム' },
    { href: '/issue_list', icon: '/images/question_list.png', label: '問題一覧' },
    { href: '/CreateProgrammingQuestion', icon: '/images/question_create.png', label: '問題作成' },
    { href: '/group', icon: '/images/group.png', label: 'グループ' },
    //提出機能とイベント機能はまだ完成してないから一旦コメントアウトで隠しておく
    { href: '/unsubmitted-assignments', icon: '/images/assignment.png', label: '課題' },
    { href: '/event/event_list', icon: '/images/event.png', label: 'イベント' },
  ];

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full bg-[#D3F7FF] text-black border-b border-gray-200 hidden md:flex items-center px-4 h-20 z-50">

      {/* 左側：ロゴ */}
      <div className="flex-shrink-0 ml-3">
        {/* Linkをaタグに変更 */}
        <a href="/home" className="transition-opacity hover:opacity-80">
          {/* Imageをimgタグに変更 */}
          <Image
            src="/images/infopia_logo.png"
            alt='Infopia'
            width={150}
            height={75}
          />
        </a>
      </div>

      {/* 中央：ナビゲーション */}
      <nav className="hidden md:flex ml-5">
        <ul className="flex items-center space-x-2">
          {navItems.map((item) => (
            <li key={item.label}>
              {/* router.pushをwindow.location.hrefに変更 */}
              <button onClick={() => window.location.href = item.href} className="w-20 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#b2ebf2] transition-colors">
                <Image src={item.icon} alt={item.label} width={40} height={40} unoptimized />
                <span className='text-[#008391] text-xs mt-1 font-bold'>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="w-24 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#b2ebf2] transition-colors">
              <Image src="/images/logout.png" alt="ログアウト" width={40} height={40} unoptimized />
              <span className='text-[#008391] text-xs mt-1 font-bold'>ログアウト</span>
            </button>
          </li>
        </ul>
      </nav>

      {/*コハクの情報*/}
      {petStatus && (
        <div className="flex items-center gap-2 ml-auto">
          {/* アイコンをStateから動的に設定 */}
          <div className="flex-shrink-0">
            <Image src={petStatus.icon} alt="ペットアイコン" width={70} height={70} unoptimized />
          </div>
          <div className="w-50">
            <div className="w-full bg-gray-300 rounded-full h-5 overflow-hidden">
              <div
                // ゲージの色をStateから動的に設定
                className={`${petStatus.colorClass} h-full rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${(petStatus.hungerlevel / MAX_HUNGER) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 右側：ユーザー情報 */}
      <div className="flex items-center gap-4 ml-6 h-full">
        {/* ランクとログイン日数 */}
        <div className="flex items-center gap-6 h-full pt-1">
          {/* Rank Circular Gauge - Enlarged */}
          <div className="relative flex flex-col items-center justify-center -mt-2">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="32" cy="32" r="26"
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                />
                {/* Progress Circle */}
                <circle
                  cx="32" cy="32" r="26"
                  fill="transparent"
                  stroke="#0EA5E9" // Sky blue
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - ((Number.isNaN(progressPercentage) ? 0 : progressPercentage) / 100))}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pb-1">
                <span className="text-sm font-bold text-sky-600">
                  {Number.isNaN(progressPercentage) ? 0 : Math.floor(progressPercentage)}%
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 bg-white px-2 rounded-full border border-sky-100 shadow-sm z-10">
              <span className="text-[11px] font-bold text-cyan-600 whitespace-nowrap">RANK {rank}</span>
            </div>
          </div>

          {/* Continuous Login - Image Style - Enlarged */}
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="relative w-12 h-12">
              <Image
                src="/images/Continuous_login.png"
                alt="Continuous Login"
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-baseline -mt-3">
              <span className="text-2xl font-bold text-slate-700 leading-none">{continuousLogin}</span>
              <span className="text-xs text-slate-500 font-bold ml-0.5">日</span>
            </div>
          </div>
        </div>

        {/* プロフィールアイコン (プルダウンメニュー付き) */}
        <div className="w-14 h-14 relative" ref={profileMenuRef}>
          {/* 元のaタグをbuttonタグに変更して開閉を制御 */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full h-full focus:outline-none"
          >
            <Image
              src={user?.icon || "/images/test_icon.webp"}
              alt="ユーザーアイコン"
              width={56}
              height={56}
              className="rounded-full object-cover transition hover:opacity-80"
              unoptimized
            />
          </button>

          {/* プルダウンメニュー */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors border-b border-gray-50 font-medium"
                >
                  プロフィール
                </a>
                <a
                  href="/profile/history"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors"
                >
                  問題解答履歴
                </a>
                <a
                  href="/customize_trace"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors"
                >
                  疑似言語トレース
                </a>
                <a
                  href="/simulator"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors"
                >
                  ノーコード
                </a>
                <a
                  href="/terms"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors"
                >
                  利用規約
                </a>
                <a
                  href="/privacypolicy"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D3F7FF] transition-colors"
                >
                  プライバシーポリシー
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}