"""
Medical RAG (Retrieval-Augmented Generation) Pipeline.

Retrieves medical context from ALL available sources before generating AI responses:
  1. WHO Essential Medicines List (LOCAL - 1,738 medicines, instant lookup)
  2. OpenFDA with API key (drug labels, adverse events, warnings, indications)
  3. RxNorm (drug identification via RxCUI)
  4. Data.gov.in with API key (Indian generic medicines - Jan Aushadhi, hospitals)
  5. Medi Client API with OAuth (additional medical data)
  6. MedlinePlus / Wikipedia (general medical encyclopedia)

The local EML knowledge base is always queried FIRST for maximum speed
and reliability, with external APIs providing supplementary data.
"""
import requests
import re
from app.config.settings import settings
from app.database.redis_cache import get_cache, set_cache
from app.rag.eml_knowledge import get_eml_context, search_medicines
from app.services.medi_service import icd_service


# Data.gov.in resource IDs for Indian medical datasets
JAN_AUSHADHI_RESOURCE_ID = "095e30ac-1f49-4be9-86f0-00ac6c034818"
HOSPITAL_RESOURCE_ID = "4a4e2e0e-3e8e-4e9e-8e2e-3e8e4e9e8e2e"


class RAGPipeline:
    def __init__(self):
        self.openfda_api_key = settings.OPENFDA_API_KEY
        self.datagov_api_key = settings.DATA_GOV_IN_API_KEY
        self.medi_client_id = settings.MEDI_CLIENT_ID
        self.medi_client_secret = settings.MEDI_CLIENT_SECRET

    # ── Local Knowledge Base (WHO EML) ──────────────────────────────

    def fetch_eml(self, query: str) -> str:
        """Search the local WHO Essential Medicines List knowledge base."""
        return get_eml_context(query)

    # ── OpenFDA (with API key for higher rate limits) ───────────────

    def fetch_openfda(self, query: str) -> str:
        """Fetch drug labels, indications, and warnings from OpenFDA."""
        cache_key = f"rag:openfda:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            # Use API key for higher rate limits (120k/day vs 40/min without key)
            url = f"https://api.fda.gov/drug/label.json"
            params = {
                "search": f"openfda.brand_name:{query}+openfda.generic_name:{query}",
                "limit": 1,
                "api_key": self.openfda_api_key
            }
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data.get("results"):
                    res_data = data["results"][0]
                    parts = []
                    
                    indications = res_data.get("indications_and_usage", [""])[0]
                    if indications:
                        parts.append(f"Indications: {indications[:400]}")
                    
                    warnings = res_data.get("warnings", [""])[0]
                    if warnings:
                        parts.append(f"Warnings: {warnings[:300]}")
                    
                    dosage = res_data.get("dosage_and_administration", [""])[0]
                    if dosage:
                        parts.append(f"Dosage: {dosage[:300]}")
                    
                    adverse = res_data.get("adverse_reactions", [""])[0]
                    if adverse:
                        parts.append(f"Adverse Reactions: {adverse[:300]}")
                    
                    contraindications = res_data.get("contraindications", [""])[0]
                    if contraindications:
                        parts.append(f"Contraindications: {contraindications[:200]}")
                    
                    if parts:
                        result = f"[OpenFDA - Authenticated] {query}:\n" + "\n".join(parts)
                        set_cache(cache_key, result, 86400)
                        return result
        except Exception as e:
            print(f"[RAG] OpenFDA error: {e}")
        return ""

    def fetch_openfda_adverse_events(self, query: str) -> str:
        """Fetch adverse event reports from OpenFDA for a given drug."""
        cache_key = f"rag:openfda_adverse:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            url = "https://api.fda.gov/drug/event.json"
            params = {
                "search": f"patient.drug.medicinalproduct:{query}",
                "limit": 3,
                "api_key": self.openfda_api_key
            }
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if data.get("results"):
                    reactions = set()
                    for event in data["results"]:
                        for reaction in event.get("patient", {}).get("reaction", []):
                            reactions.add(reaction.get("reactionmeddrapt", ""))
                    if reactions:
                        result = f"[OpenFDA Adverse Events] Reported reactions for {query}: {', '.join(list(reactions)[:15])}"
                        set_cache(cache_key, result, 86400)
                        return result
        except Exception as e:
            print(f"[RAG] OpenFDA adverse events error: {e}")
        return ""

    # ── RxNorm (free, no key needed) ────────────────────────────────

    def fetch_rxnorm(self, query: str) -> str:
        """Identify drugs via RxNorm and get their RxCUI."""
        cache_key = f"rag:rxnorm:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            res = requests.get(
                f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={query}",
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                if "idGroup" in data and "rxnormId" in data["idGroup"]:
                    rxcui = data["idGroup"]["rxnormId"][0]
                    
                    # Also fetch related drug info
                    info_parts = [f"[RxNorm] {query} recognized with RxCUI: {rxcui}."]
                    
                    # Try to get drug properties
                    try:
                        prop_res = requests.get(
                            f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/allProperties.json?prop=all",
                            timeout=3
                        )
                        if prop_res.status_code == 200:
                            props = prop_res.json()
                            for prop in props.get("propConceptGroup", {}).get("propConcept", [])[:5]:
                                info_parts.append(f"  {prop.get('propName', '')}: {prop.get('propValue', '')}")
                    except Exception:
                        pass
                    
                    result = "\n".join(info_parts)
                    set_cache(cache_key, result, 86400)
                    return result
        except Exception as e:
            print(f"[RAG] RxNorm error: {e}")
        return ""

    # ── Data.gov.in (with API key - Indian medical data) ────────────

    def fetch_datagov_medicines(self, query: str) -> str:
        """Search Indian Jan Aushadhi generic medicines from Data.gov.in."""
        if not self.datagov_api_key:
            return ""
            
        cache_key = f"rag:datagov_med:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            url = f"https://api.data.gov.in/resource/{JAN_AUSHADHI_RESOURCE_ID}"
            params = {
                "api-key": self.datagov_api_key,
                "format": "json",
                "limit": 5,
                "filters[generic_name]": query
            }
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 200:
                data = res.json()
                records = data.get("records", [])
                if records:
                    parts = [f"[Data.gov.in - Jan Aushadhi] Generic medicines matching '{query}':"]
                    for rec in records[:5]:
                        name = rec.get("generic_name", rec.get("medicine_name", "Unknown"))
                        price = rec.get("mrp", rec.get("price", "N/A"))
                        unit = rec.get("unit_size", rec.get("pack_size", ""))
                        parts.append(f"  - {name} | Price: ₹{price} | {unit}")
                    result = "\n".join(parts)
                    set_cache(cache_key, result, 86400)
                    return result
        except Exception as e:
            print(f"[RAG] Data.gov.in medicines error: {e}")
        return ""

    def fetch_datagov_hospitals(self, query: str) -> str:
        """Search Indian hospitals from Data.gov.in."""
        if not self.datagov_api_key:
            return ""
            
        cache_key = f"rag:datagov_hosp:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            url = f"https://api.data.gov.in/resource/{HOSPITAL_RESOURCE_ID}"
            params = {
                "api-key": self.datagov_api_key,
                "format": "json",
                "limit": 5,
                "filters[state_name]": query
            }
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 200:
                data = res.json()
                records = data.get("records", [])
                if records:
                    parts = [f"[Data.gov.in - Hospital Directory] Hospitals in '{query}':"]
                    for rec in records[:5]:
                        name = rec.get("hospital_name", rec.get("name", "Unknown"))
                        loc = rec.get("location", rec.get("address", ""))
                        parts.append(f"  - {name} | {loc}")
                    result = "\n".join(parts)
                    set_cache(cache_key, result, 86400)
                    return result
        except Exception as e:
            print(f"[RAG] Data.gov.in hospitals error: {e}")
        return ""

    # ── WHO ICD-11 API (OAuth authenticated) ───────────────────────

    def fetch_medi_data(self, query: str) -> str:
        """Fetch medical data from the WHO ICD-11 API."""
        # The icd_service handles OAuth token caching and API requests internally
        try:
            return icd_service.get_icd_context(query)
        except Exception as e:
            print(f"[RAG] ICD API error: {e}")
            return ""

    # ── MedlinePlus / Wikipedia ─────────────────────────────────────

    def fetch_medlineplus(self, query: str) -> str:
        """Fetch medical encyclopedia data."""
        cache_key = f"rag:medline:{query}"
        cached = get_cache(cache_key)
        if cached:
            return cached

        try:
            res = requests.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{query}",
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                extract = data.get('extract', '')
                if extract:
                    result = f"[Medical Encyclopedia] {query}: {extract}"
                    set_cache(cache_key, result, 86400)
                    return result
        except Exception as e:
            print(f"[RAG] MedlinePlus error: {e}")
        return ""

    # ── Main RAG Orchestrator ───────────────────────────────────────

    def get_medical_context(self, message: str) -> str:
        """
        Orchestrates retrieval from ALL medical knowledge sources.
        Priority order:
          1. WHO EML local knowledge base (always, instant)
          2. OpenFDA with API key (drug labels + adverse events)
          3. RxNorm (drug identification)
          4. Data.gov.in with API key (Indian generic medicines, hospitals)
          5. Medi Client API with OAuth (additional medical data)
          6. MedlinePlus / Encyclopedia (general medical info)
        """
        msg_lower = message.lower()
        sources_used = []
        context = ""

        is_medicine = any(w in msg_lower for w in [
            "medicine", "drug", "pill", "tablet", "capsule", "injection",
            "side effect", "dosage", "dose", "take", "prescribe", "prescription",
            "metformin", "paracetamol", "ibuprofen", "amoxicillin", "aspirin",
            "insulin", "omeprazole", "antibiotic", "painkiller", "vaccine",
            "generic", "brand", "adverse", "reaction", "interaction",
            "contraindication", "overdose", "withdrawal"
        ])
        is_disease = any(w in msg_lower for w in [
            "disease", "symptom", "cause", "treatment", "cure", "diagnosis",
            "diabetes", "asthma", "hypertension", "cancer", "infection",
            "fever", "headache", "pain", "cough", "cold", "flu",
            "what is", "how to treat", "suffering from", "condition",
            "disorder", "syndrome", "chronic", "acute"
        ])
        is_hospital = any(w in msg_lower for w in [
            "hospital", "clinic", "emergency room", "doctor near me",
            "cardiologist", "specialist", "nearest hospital", "medical center"
        ])
        is_price = any(w in msg_lower for w in [
            "price", "cost", "cheap", "affordable", "generic", "jan aushadhi",
            "how much", "rupee", "rs", "inr"
        ])

        # Extract meaningful keywords
        stop_words = {
            "what", "is", "the", "a", "of", "and", "in", "to", "can", "i",
            "with", "for", "side", "effects", "symptoms", "me", "my", "about",
            "tell", "please", "help", "how", "do", "does", "should", "would",
            "have", "has", "this", "that", "there", "are", "am", "be", "been",
            "will", "you", "your", "it", "its", "from", "on", "at", "by"
        }
        words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', msg_lower).split() if w not in stop_words and len(w) > 1]
        if not words:
            return ""

        primary_query = words[0]
        if len(words) > 1 and is_medicine:
            primary_query = words[-1]

        # ── SOURCE 1: WHO Essential Medicines List (LOCAL, instant) ──
        eml_context = self.fetch_eml(message)
        if not eml_context:
            eml_context = self.fetch_eml(primary_query)
        if eml_context:
            context += eml_context + "\n\n"
            sources_used.append("WHO Essential Medicines List")

        # ── SOURCE 2: OpenFDA with API Key (drug labels + adverse events) ──
        if is_medicine or is_disease:
            fda = self.fetch_openfda(primary_query)
            if fda:
                context += fda + "\n\n"
                sources_used.append("OpenFDA (Authenticated)")
            
            # Also fetch adverse event reports for drug queries
            if is_medicine:
                adverse = self.fetch_openfda_adverse_events(primary_query)
                if adverse:
                    context += adverse + "\n\n"
                    if "OpenFDA Adverse Events" not in sources_used:
                        sources_used.append("OpenFDA Adverse Events")

        # ── SOURCE 3: RxNorm (drug identification + properties) ─────
        if is_medicine:
            rx = self.fetch_rxnorm(primary_query)
            if rx:
                context += rx + "\n\n"
                sources_used.append("RxNorm (NLM)")

        # ── SOURCE 4: Data.gov.in with API Key (Indian medicines & hospitals) ──
        if is_medicine or is_price:
            datagov_med = self.fetch_datagov_medicines(primary_query)
            if datagov_med:
                context += datagov_med + "\n\n"
                sources_used.append("Data.gov.in (Jan Aushadhi)")

        if is_hospital:
            # Try to extract location/state from the message
            location_query = primary_query
            for w in words:
                if len(w) > 3 and w not in ["hospital", "clinic", "nearest", "near", "find"]:
                    location_query = w
                    break
            datagov_hosp = self.fetch_datagov_hospitals(location_query)
            if datagov_hosp:
                context += datagov_hosp + "\n\n"
                sources_used.append("Data.gov.in (Hospital Directory)")

        # ── SOURCE 5: WHO ICD-11 API (OAuth authenticated) ─────────
        if is_medicine or is_disease:
            icd = self.fetch_medi_data(primary_query)
            if icd:
                context += icd + "\n\n"
                sources_used.append("WHO ICD-11 API")

        # ── SOURCE 6: MedlinePlus / Encyclopedia ────────────────────
        if is_disease or (not is_medicine and not is_hospital):
            med = self.fetch_medlineplus(primary_query)
            if med:
                context += med + "\n\n"
                sources_used.append("MedlinePlus / Encyclopedia")

        # ── Fallback: try encyclopedia if nothing else matched ──────
        if not sources_used:
            med = self.fetch_medlineplus(words[0])
            if med:
                context += med + "\n\n"
                sources_used.append("MedlinePlus / Encyclopedia")

        if context:
            return (
                f"\n\nMEDICAL KNOWLEDGE CONTEXT (from {len(sources_used)} verified sources):\n"
                f"{context}\n"
                f"SOURCES USED: {', '.join(sources_used)}\n"
                f"IMPORTANT: Use the above context to answer accurately. "
                f"Always cite the sources used at the end of your response. "
                f"Do not hallucinate or invent medical information. "
                f"If you are unsure, say so and recommend consulting a doctor."
            )
        return ""


rag_pipeline = RAGPipeline()
