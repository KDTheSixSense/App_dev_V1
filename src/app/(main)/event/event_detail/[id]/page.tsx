// イベント詳細画面
// app/(main)/event/event_detail/[id]/page.tsx

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams も Promise の場合
};

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const resolvedSearchParams = searchParams ? await searchParams : undefined; // searchParams を await する
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      
    </div>
  );
};