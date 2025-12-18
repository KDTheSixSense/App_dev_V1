
import RankingSection from "@/components/dashboard/RankingSection";

export const revalidate = 300; // 5分間キャッシュ

export default function RankingPage() {
  return <RankingSection />;
}