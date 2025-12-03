import sys
import json
import io
import traceback

# デバッグ用: 標準エラー出力のエンコーディングを強制
sys.stderr.reconfigure(encoding='utf-8')

def main():
    try:
        # 標準入力からコードを読み込む
        code = sys.stdin.read()
        
        if not code.strip():
            print("[]")
            return

        trace_log = []
        stdout_buffer = io.StringIO()

        def trace_lines(frame, event, arg):
            if event != 'line':
                return trace_lines
            
            filename = frame.f_code.co_filename
            if filename != '<string>':
                return trace_lines

            try:
                line_no = frame.f_lineno
                
                local_vars = {}
                for k, v in frame.f_locals.items():
                    try:
                        if isinstance(v, (int, float, str, bool, list, dict, tuple, set, type(None))):
                            local_vars[k] = v
                        else:
                            local_vars[k] = str(v)
                    except:
                        local_vars[k] = "<unserializable>"

                current_stdout = stdout_buffer.getvalue()
                
                trace_log.append({
                    "line": line_no,
                    "variables": local_vars.copy(),
                    "stdout": current_stdout,
                    "event": "step"
                })
            except Exception as e:
                sys.stderr.write(f"[Python Tracer] Trace Logic Error: {e}\n")

            return trace_lines

        original_stdout = sys.stdout
        sys.stdout = stdout_buffer
        
        last_vars = {}

        try:
            sys.settrace(trace_lines)
            compiled_code = compile(code, '<string>', 'exec')
            exec(compiled_code, {'__name__': '__main__'})
        except Exception:
            trace_log.append({
                "line": -1,
                "variables": {},
                "stdout": stdout_buffer.getvalue(),
                "error": traceback.format_exc(),
                "event": "error"
            })
        finally:
            sys.settrace(None)
            sys.stdout = original_stdout

        # --- 修正点: 実行完了後の最終状態を追加 ---
        # 最後のステップの変数を引き継ぐ（もしあれば）
        if trace_log and trace_log[-1].get("variables"):
            last_vars = trace_log[-1]["variables"]

        # 最終的な出力を取得
        final_stdout = stdout_buffer.getvalue()

        # 「実行完了」を表すステップを追加（行番号はハイライトなし=-1 または 最終行など）
        trace_log.append({
            "line": -1, # ハイライトを消すために-1
            "variables": last_vars,
            "stdout": final_stdout,
            "event": "finish"
        })
        # ------------------------------------------

        print(json.dumps(trace_log, default=str))

    except Exception as e:
        sys.stderr.write(f"[Python Tracer] System Error: {e}\n")
        print("[]")

if __name__ == "__main__":
    main()