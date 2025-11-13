// components/AceEditorWrapper.tsx
'use client';

import React from 'react';
import AceEditor, { IAceEditorProps } from 'react-ace';

// 1. 必要な「モード」（言語のシンタックスハイライト）をインポート
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp'; // CとC++
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-php';

// 2. 必要な「テーマ」（エディタの配色）をインポート
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow_night';

// 3. 必要な「機能拡張」をインポート
import 'ace-builds/src-noconflict/ext-language_tools'; // 自動補完とスニペット
import 'ace-builds/src-noconflict/ext-beautify';

// Ace Editorのワーカーパスを設定
import ace from 'ace-builds/src-noconflict/ace';
const cdnBaseUrl = "https://cdn.jsdelivr.net/npm/ace-builds@1.33.0/src-noconflict/";
ace.config.set("basePath", cdnBaseUrl);
ace.config.set("modePath", cdnBaseUrl);
ace.config.set("themePath", cdnBaseUrl);
ace.config.set("workerPath", cdnBaseUrl);

// このラッパーコンポーネントは、react-aceのすべてのプロパティを受け取れるようにIAceEditorPropsを型として使います
const AceEditorWrapper: React.FC<IAceEditorProps> = (props) => {
  return <AceEditor {...props} />;
};

export default AceEditorWrapper;
