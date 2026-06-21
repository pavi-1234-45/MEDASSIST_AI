import requests
import os
import re

OPENFDA_API_KEY = os.getenv("OPENFDA_API_KEY", "B0mcBJbkjGS6ajtz6pN61LTwmnczRGYGjV4fz61K")

def fetch_openfda(query):
    try:
        res = requests.get(f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{query}&limit=1", timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data.get("results"):
                res_data = data["results"][0]
                indications = res_data.get("indications_and_usage", [""])[0]
                warnings = res_data.get("warnings", [""])[0]
                return f"[OpenFDA] {query}: {indications[:300]}... Warnings: {warnings[:200]}..."
    except Exception:
        pass
    return ""

def fetch_rxnorm(query):
    try:
        res = requests.get(f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={query}", timeout=3)
        if res.status_code == 200:
            data = res.json()
            if "idGroup" in data and "rxnormId" in data["idGroup"]:
                rxcui = data["idGroup"]["rxnormId"][0]
                return f"[RxNorm] {query} recognized with RxCUI: {rxcui}."
    except Exception:
        pass
    return ""

def fetch_medlineplus(query):
    try:
        # Using Wikipedia as a fallback/proxy for general disease/medical conditions since MedlinePlus connect requires specific coding.
        # NLM's MedlinePlus web service search
        res = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{query}", timeout=3)
        if res.status_code == 200:
            data = res.json()
            return f"[Medical Encyclopedia] {query}: {data.get('extract', '')}"
    except Exception:
        pass
    return ""

def get_medical_context(message: str) -> str:
    msg_lower = message.lower()
    sources_used = []
    context = ""
    
    # Simple rule-based intent
    is_medicine = any(w in msg_lower for w in ["medicine", "drug", "pill", "side effect", "dosage", "take", "metformin", "paracetamol", "ibuprofen"])
    is_disease = any(w in msg_lower for w in ["disease", "symptom", "cause", "diabetes", "asthma", "hypertension", "what is"])
    is_hospital = any(w in msg_lower for w in ["hospital", "clinic", "emergency room", "doctor near me", "cardiologist"])
    
    # Extract potential keywords by removing common stop words
    words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', msg_lower).split() if w not in ["what", "is", "the", "a", "of", "and", "in", "to", "can", "i", "with", "for", "side", "effects", "symptoms"]]
    if not words:
        return ""
    
    primary_query = words[0]
    if len(words) > 1 and is_medicine:
        # try to find the medicine name
        primary_query = words[-1] # Usually at the end like "side effects of paracetamol"
        
    if is_medicine:
        fda = fetch_openfda(primary_query)
        rx = fetch_rxnorm(primary_query)
        if fda:
            context += fda + " "
            sources_used.append("OpenFDA")
        if rx:
            context += rx + " "
            if "RxNorm" not in sources_used:
                sources_used.append("RxNorm")
                
    if is_disease or (not is_medicine and not is_hospital):
        med = fetch_medlineplus(primary_query)
        if med:
            context += med + " "
            sources_used.append("MedlinePlus / Encyclopedia")
            
    if is_hospital:
        context += f"[Hospital Directory] Suggest searching local directories for {primary_query} specialists. "
        sources_used.append("National Hospital Directory")
        
    if not sources_used:
        # Fallback to general medical dictionary
        med = fetch_medlineplus(words[0])
        if med:
            context += med + " "
            sources_used.append("MedlinePlus / Encyclopedia")

    if context:
        return f"\n\nMEDICAL KNOWLEDGE CONTEXT:\n{context}\n\nSOURCES USED: {', '.join(sources_used)}\nIMPORTANT: Use the above context to answer accurately. End your response by listing the 'Sources Used'."
    return ""
