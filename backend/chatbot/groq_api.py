import os

try:
    from groq import Groq
except Exception:
    Groq = None


groq_api_key = os.getenv("GROQ_API_KEY")
client = None

if Groq is not None and groq_api_key:
    try:
        client = Groq(api_key=groq_api_key)
        print("✅ Groq client initialized")
    except Exception as e:
        client = None
        print(f"⚠️ Groq init failed: {e}")
else:
    print("⚠️ GROQ_API_KEY not found. Fallback mode enabled.")


def safe_ai_chat(messages, fallback):
    if client is None:
        return fallback

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.35
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"⚠️ Groq failed: {e}")
        return fallback