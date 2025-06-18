// app/Header.tsx
import Link from 'next/link';
import Image from 'next/image'; // Imageコンポーネントをインポート

export default function Header() {
  return (
    <header className="bg-[#fff] text-white shadow-md flex w-full">
      <div className="flex items-center w-50 h-20 mx-4">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
          <Image 
            src="/images/infopia_logo.png"
            alt='Infopia Logo'
            width={200}
            height={50}
          />
        </Link>
      </div>
      <div className='flex items-center'>
        <nav>
          <ul className="flex space-x-6">
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/home.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>ホーム</span>
              </Link>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/question_list.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>問題一覧</span>
              </Link>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/question_create.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>問題作成</span>
              </Link>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/group.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>グループ</span>
              </Link>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/assignment.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>提出</span>
              </Link>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <Link href="/" className="hover:text-gray-300 flex flex-col transition-colors justify-center items-center">
                <Image
                    src="/images/ivent.png"
                    alt="Home Icon"
                    width={40} 
                    height={40}
                />
                <span className='text-gray-800'>イベント</span>
              </Link>
            </div>
          </ul>
        </nav>
      </div>
      <div className='flex items-center justify-end ml-auto mr-2'>
        <div className='flex items-center justify-end border-2 px border-[#ccc] rounded-full h-15 w-15 bg-white'>
          <Link href="/" className="">
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}