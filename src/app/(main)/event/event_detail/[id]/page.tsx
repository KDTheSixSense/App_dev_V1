// イベント詳細画面
// app/(main)/event/event_detail/[id]/page.tsx

interface EventDetailPageProps {
  params: {
    id: string; // URLの[id]部分が文字列として渡されます
  };
}

const EventDetailPage = ({ params }: EventDetailPageProps) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      
    </div>
  );
};

export default EventDetailPage;