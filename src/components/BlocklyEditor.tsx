// src/components/BlocklyEditor.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import 'blockly/blocks';
import * as locale from 'blockly/msg/ja';

// Blocklyの言語設定
Blockly.setLocale(locale as any);

// Scratch風のカスタムテーマ定義
const ScratchTheme = Blockly.Theme.defineTheme('scratch', {
  name: 'scratch',
  base: Blockly.Themes.Classic,
  blockStyles: {
    logic_blocks: { colourPrimary: '#FFAB19', colourSecondary: '#CF8B17', colourTertiary: '#8F6010' },
    loop_blocks: { colourPrimary: '#FFAB19', colourSecondary: '#CF8B17', colourTertiary: '#8F6010' },
    math_blocks: { colourPrimary: '#59C059', colourSecondary: '#389438', colourTertiary: '#205720' },
    text_blocks: { colourPrimary: '#59C059', colourSecondary: '#389438', colourTertiary: '#205720' },
    list_blocks: { colourPrimary: '#FF6680', colourSecondary: '#FF3355', colourTertiary: '#CD1F42' },
    variable_blocks: { colourPrimary: '#FF8C1A', colourSecondary: '#DB6E00', colourTertiary: '#A65300' },
    procedure_blocks: { colourPrimary: '#FF6680', colourSecondary: '#FF3355', colourTertiary: '#CD1F42' },
    colour_blocks: { colourPrimary: '#59C059', colourSecondary: '#389438', colourTertiary: '#205720' },
  },
  categoryStyles: {
    logic_category: { colour: '#FFAB19' },
    loop_category: { colour: '#FFAB19' },
    math_category: { colour: '#59C059' },
    text_category: { colour: '#59C059' },
    list_category: { colour: '#FF6680' },
    colour_category: { colour: '#59C059' },
    variable_category: { colour: '#FF8C1A' },
    procedure_category: { colour: '#FF6680' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#F9F9F9',
    toolboxBackgroundColour: '#FFFFFF',
    toolboxForegroundColour: '#575E75',
    flyoutBackgroundColour: '#F9F9F9',
    flyoutForegroundColour: '#575E75',
    flyoutOpacity: 1,
    scrollbarColour: '#CECDCE',
    insertionMarkerColour: '#000000',
    insertionMarkerOpacity: 0.2,
  },
  fontStyle: {
    family: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    weight: 'bold',
    size: 12,
  },
});

interface BlocklyEditorProps {
  initialXml?: string;
  onCodeChange: (code: string) => void;
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ initialXml, onCodeChange }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const lastCategoryIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!blocklyDiv.current) return;
    if (workspaceRef.current) return;

    // ワークスペースの注入
    const workspace = Blockly.inject(blocklyDiv.current, {
      renderer: 'zelos',
      theme: ScratchTheme,
      toolbox: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <category name="論理" categoryStyle="logic_category">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
            <block type="logic_null"></block>
            <block type="logic_ternary"></block>
          </category>
          <category name="ループ" categoryStyle="loop_category">
            <block type="controls_repeat_ext">
              <value name="TIMES">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
            </block>
            <block type="controls_whileUntil"></block>
            <block type="controls_for">
              <value name="FROM">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="TO">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
              <value name="BY">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
            </block>
            <block type="controls_forEach"></block>
            <block type="controls_flow_statements"></block>
          </category>
          <category name="計算" categoryStyle="math_category">
            <block type="math_number">
              <field name="NUM">123</field>
            </block>
            <block type="math_arithmetic">
              <value name="A">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="B">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
            </block>
            <block type="math_single"></block>
            <block type="math_trig"></block>
            <block type="math_constant"></block>
            <block type="math_number_property"></block>
            <block type="math_round"></block>
            <block type="math_on_list"></block>
            <block type="math_modulo"></block>
            <block type="math_constrain">
              <value name="LOW">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </shadow>
              </value>
              <value name="HIGH">
                <shadow type="math_number">
                  <field name="NUM">100</field>
                </value>
              </value>
            </block>
            <block type="math_random_int">
              <value name="FROM">
                <shadow type="math_number">
                  <field name="NUM">1</field>
                </value>
              </value>
              <value name="TO">
                <shadow type="math_number">
                  <field name="NUM">100</field>
                </value>
              </value>
            </block>
            <block type="math_random_float"></block>
          </category>
          <category name="テキスト" categoryStyle="text_category">
            <block type="text"></block>
            <block type="text_join"></block>
            <block type="text_append">
              <value name="TEXT">
                <shadow type="text"></shadow>
              </value>
            </block>
            <block type="text_length">
              <value name="VALUE">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_isEmpty">
              <value name="VALUE">
                <shadow type="text">
                  <field name="TEXT"></field>
                </shadow>
              </value>
            </block>
            <block type="text_indexOf">
              <value name="VALUE">
                <block type="variables_get">
                  <field name="VAR">text</field>
                </block>
              </value>
              <value name="FIND">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_charAt">
              <value name="VALUE">
                <block type="variables_get">
                  <field name="VAR">text</field>
                </block>
              </value>
            </block>
            <block type="text_getSubstring">
              <value name="STRING">
                <block type="variables_get">
                  <field name="VAR">text</field>
                </block>
              </value>
            </block>
            <block type="text_changeCase">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_trim">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_print">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
            <block type="text_prompt_ext">
              <value name="TEXT">
                <shadow type="text">
                  <field name="TEXT">abc</field>
                </shadow>
              </value>
            </block>
          </category>
          <category name="リスト" categoryStyle="list_category">
            <block type="lists_create_with">
              <mutation items="0"></mutation>
            </block>
            <block type="lists_create_with"></block>
            <block type="lists_repeat">
              <value name="NUM">
                <shadow type="math_number">
                  <field name="NUM">5</field>
                </value>
              </block>
            <block type="lists_length"></block>
            <block type="lists_isEmpty"></block>
            <block type="lists_indexOf">
              <value name="VALUE">
                <block type="variables_get">
                  <field name="VAR">list</field>
                </block>
              </value>
            </block>
            <block type="lists_getIndex">
              <value name="VALUE">
                <block type="variables_get">
                  <field name="VAR">list</field>
                </block>
              </value>
            </block>
            <block type="lists_setIndex">
              <value name="LIST">
                <block type="variables_get">
                  <field name="VAR">list</field>
                </block>
              </value>
            </block>
            <block type="lists_getSublist">
              <value name="LIST">
                <block type="variables_get">
                  <field name="VAR">list</field>
                </block>
              </value>
            </block>
            <block type="lists_split">
              <value name="DELIM">
                <shadow type="text">
                  <field name="TEXT">,</field>
                </shadow>
              </value>
            </block>
            <block type="lists_sort"></block>
          </category>
          <sep></sep>
          <category name="変数" categoryStyle="variable_category" custom="VARIABLE"></category>
          <category name="関数" categoryStyle="procedure_category" custom="PROCEDURE"></category>
        </xml>
      `,
      scrollbars: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true, // ホイールでの移動を有効化
      },
      zoom: {
        controls: true,
        wheel: false, // ▼▼▼ 修正: ホイールでのズームを無効化（これでスクロール動作になります） ▼▼▼
        startScale: 0.9,
        maxScale: 3.0,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#e0e0e0',
        snap: true,
      },
      media: '/media/',
    });

    workspaceRef.current = workspace;

    if (initialXml) {
      const xml = Blockly.utils.xml.textToDom(initialXml);
      Blockly.Xml.domToWorkspace(xml, workspace);
    }

    // アニメーション制御ロジック
    const handleToolboxSelection = (event: any) => {
      if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT && event.newItem) {
        const toolbox = workspace.getToolbox() as any;
        const flyout = workspace.getFlyout();

        if (toolbox && flyout) {
          const items = toolbox.getToolboxItems();
          const newIndex = items.findIndex((item: any) => item.getId() === event.newItem);

          if (newIndex !== -1) {
            const flyoutGroup = flyout.getWorkspace()?.getCanvas();

            if (flyoutGroup) {
              flyoutGroup.classList.remove('flyout-anim-up');
              flyoutGroup.classList.remove('flyout-anim-down');
              void flyoutGroup.getBoundingClientRect();

              if (newIndex > lastCategoryIndexRef.current) {
                flyoutGroup.classList.add('flyout-anim-up');
              } else {
                flyoutGroup.classList.add('flyout-anim-down');
              }
            }
            lastCategoryIndexRef.current = newIndex;
          }
        }
      }
    };
    workspace.addChangeListener(handleToolboxSelection);

    // コード生成処理
    const updateCode = () => {
      if (!workspace || workspace.isDragging()) {
        return;
      }
      try {
        const code = javascriptGenerator.workspaceToCode(workspace);
        onCodeChange(code);
      } catch (e) {
        console.warn('Code generation skipped:', e);
      }
    };

    workspace.addChangeListener(updateCode);

    // リサイズハンドラ
    const handleResize = () => {
      if (workspace) {
        try {
          Blockly.svgResize(workspace);
        } catch (e) {
          // リサイズ失敗時は無視
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (workspace) {
        try {
          workspace.dispose();
        } catch (e) {
          // 破棄エラーは無視
        }
      }
      workspaceRef.current = null;
    };
  }, [initialXml, onCodeChange]);

  return (
    <>
      <style jsx global>{`
        /* ツールボックス（左側のメニュー）のスタイル調整 */
        .blocklyToolboxDiv {
          background-color: #FFFFFF !important;
          border-right: 1px solid #e0e0e0;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .blocklyToolboxDiv::-webkit-scrollbar {
          display: none;
        }

        /* スクロールバー非表示 */
        .blocklyScrollbarHorizontal, .blocklyScrollbarVertical {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        .blocklyFlyoutScrollbar {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        /* テキストフォント */
        .blocklyText {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          font-weight: bold;
        }

        /* アニメーション定義 */
        .flyout-anim-up {
          animation: slideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .flyout-anim-down {
          animation: slideDown 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes slideDown {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        ref={blocklyDiv}
        style={{ width: '100%', height: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-300 shadow-inner bg-white"
      />
    </>
  );
};

export default BlocklyEditor;