import json
import sys

def validate_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"JSON is valid. Found {len(data)} items.")
    except json.JSONDecodeError as e:
        print(f"JSON error at line {e.lineno}, column {e.colno}: {e.msg}")
        # Print a bit of context around the error
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            start = max(0, e.lineno - 5)
            end = min(len(lines), e.lineno + 5)
            for i in range(start, end):
                prefix = ">> " if i == e.lineno - 1 else "   "
                print(f"{prefix}{i+1}: {lines[i].strip()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        validate_json(sys.argv[1])
    else:
        print("Please provide a file path.")
