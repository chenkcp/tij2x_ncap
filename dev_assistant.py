import requests
import os

OLLAMA_URL = "http://localhost:11434/api/generate"

def ask_ollama(prompt):
    system_prompt = """
You are a precise software engineer.

RULES:
- Ignore dev_assistant.py (tooling file)
- Detect project type from package.json, not file extensions
- Do NOT classify as Python unless main.py exists
- Always verify entry file exists before suggesting it
- If unsure, say "I need more info"
"""

    res = requests.post(
        OLLAMA_URL,
        json={
            "model": "llama3",
            "prompt": system_prompt + "\n\n" + prompt,
            "stream": False,
            "options": {"temperature": 0}
        }
    )
    return res.json()["response"]

def list_files():
    return [f for f in os.listdir() if f != "dev_assistant.py"]

def read_file(file):
    try:
        with open(file, "r", encoding="utf-8") as f:
            return f.read()
    except:
        return None

def analyze_project():
    files = list_files()

    backend_files = []
    frontend_files = []

    if "backend" in files:
        backend_files = os.listdir("backend")

    if "frontend" in files:
        frontend_files = os.listdir("frontend")

    prompt = f"""
Root files:
{files}

Backend files:
{backend_files}

Frontend files:
{frontend_files}

Rules:
- Determine project type based on package.json, not .py files
- This is NOT a Python project unless clearly proven
- Identify correct backend and frontend entry points
- Ignore .py files unless explicitly asked

Explain:
1. Project type
2. Backend entry file
3. Frontend start method
4. Correct run commands
"""
    
    return ask_ollama(prompt)

def debug_error(error):
    return ask_ollama(f"""
Fix this error:

{error}

Explain root cause and solution
""")

def suggest_run():
    if "package.json" in list_files():
        content = read_file("package.json")
        return ask_ollama(f"""
package.json:
{content}

Give correct run commands. Do NOT guess files.
""")
    return "No package.json found."

# ✅ Main loop
while True:
    cmd = input("\nYou: ")

    if cmd == "exit":
        break

    elif cmd == "analyze":
        print(analyze_project())

    elif cmd.startswith("debug"):
        print(debug_error(cmd))

    elif cmd == "run":
        print(suggest_run())

    else:
        print(ask_ollama(cmd))