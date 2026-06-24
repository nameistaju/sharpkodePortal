import json

log_path = r"C:\Users\bantu\.gemini\antigravity\brain\5a7e19a6-3356-4cdd-ad66-628facf2f1f3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if "fetchDashboard" in line:
            print(f"Line {i} contains fetchDashboard")
            try:
                obj = json.loads(line)
                # print a summary of the object
                print(f"  Type: {obj.get('type')}, Source: {obj.get('source')}")
                # check if there's error content
                content = str(obj.get('content', ''))
                if "fetchDashboard" in content:
                    print(f"  Content length: {len(content)}")
                    # print lines around fetchDashboard in content
                    c_lines = content.split('\n')
                    for j, cl in enumerate(c_lines):
                        if "fetchDashboard" in cl:
                            print(f"    Content Line {j}: {cl}")
            except Exception as e:
                print(f"  Error parsing JSON: {e}")
