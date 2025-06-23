import Image from "next/image";
import Header from "../Header"; //home/Headerとbodyを読み込み、HeaderとBodyに定義
import Body from "./body";

export default function Home() {
  return (
    <div className="bg-white text-black">
      <Body />
    </div>
  );
}
