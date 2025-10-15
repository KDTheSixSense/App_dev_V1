"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHintFromAI = getHintFromAI;
/**
 * メッセージとコンテキストをバックエンドAPIに送信し、AIからのヒントを取得する関数
 * @param question ユーザーからの質問
 * @param context AIがヒントを生成するための文脈情報
 */
async function getHintFromAI(question, context) {
    try {
        const response = await fetch('/api/generate-hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, context }),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        const data = await response.json();
        return data.hint;
    }
    catch (error) {
        console.error("Failed to get hint:", error);
        // ユーザーに表示するエラーメッセージ
        return "申し訳ありません、ヒントの生成中にエラーが発生しました。";
    }
}
