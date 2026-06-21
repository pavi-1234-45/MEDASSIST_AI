import os
import json
import time
import requests

API_KEY = "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"
URL = "https://integrate.api.nvidia.com/v1/chat/completions"

languages = [
  {"code": "en", "name": "English"},
  {"code": "ta", "name": "Tamil"},
  {"code": "te", "name": "Telugu"},
  {"code": "ml", "name": "Malayalam"},
  {"code": "kn", "name": "Kannada"},
  {"code": "hi", "name": "Hindi"}
]

def translate_chunk(target_lang, chunk):
    prompt = f"Translate the values of this JSON object into {target_lang}. Preserve the exact JSON keys. Return ONLY a valid JSON object starting with {{ and ending with }}.\nJSON:\n{json.dumps(chunk)}"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    data = {
        "model": "meta/llama-3.1-70b-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 4000
    }
    
    session = requests.Session()
    response = session.post(URL, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    
    content = result["choices"][0]["message"]["content"]
    content = content.replace("```json", "").replace("```", "").strip()
    
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end+1]
        
    return json.loads(content)

def main():
    with open('en.json', 'r', encoding='utf-8') as f:
        en_dict = json.load(f)

    new_translations = {"en": en_dict}
    entries = list(en_dict.items())
    chunk_size = 40
    
    for lang in languages:
        if lang["code"] == "en":
            continue
        print(f"Translating to {lang['name']}...")
        
        translated_dict = {}
        for i in range(0, len(entries), chunk_size):
            chunk = dict(entries[i:i + chunk_size])
            success = False
            retries = 3
            while not success and retries > 0:
                try:
                    translated_chunk = translate_chunk(lang["name"], chunk)
                    translated_dict.update(translated_chunk)
                    success = True
                    print(f"  Chunk {i // chunk_size + 1} success")
                except Exception as e:
                    retries -= 1
                    print(f"  Error in chunk {i // chunk_size + 1}: {e}")
                    time.sleep(2)
            
            if not success:
                print(f"  Failed to translate chunk {i // chunk_size + 1} completely.")
                # fallback for missing keys
                translated_dict.update(chunk)
                
        new_translations[lang["code"]] = translated_dict
        print(f"Finished {lang['name']}")
            
    with open("./src/data/translations.js", "w", encoding="utf-8") as f:
        f.write(f"export const languages = {json.dumps(languages, indent=2)};\n\n")
        f.write(f"export const translations = {json.dumps(new_translations, indent=2)};\n")
        
    print("Done!")

if __name__ == "__main__":
    main()
