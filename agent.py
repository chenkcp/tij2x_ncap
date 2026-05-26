import requests

def ask_ollama(prompt):
    res = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )
    return res.json()["response"]

# Example task
response = ask_ollama(
    "Given a Node.js project with backend and frontend, explain how to run it step by step"
)

print(response)
