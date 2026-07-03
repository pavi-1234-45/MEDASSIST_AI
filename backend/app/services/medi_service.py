"""
WHO ICD-11 API Service (International Classification of Diseases).

Uses OAuth2 Client Credentials to authenticate and query the ICD-11 API
for disease classification, diagnosis codes, and medical terminology.

Token Endpoint: https://icdaccessmanagement.who.int/connect/token
API Base URL:   https://id.who.int/icd
Swagger:        https://id.who.int/swagger/index.html
"""
import requests
from app.config.settings import settings
from app.database.redis_cache import get_cache, set_cache


class ICDService:
    def __init__(self):
        self.client_id = settings.MEDI_CLIENT_ID
        self.client_secret = settings.MEDI_CLIENT_SECRET
        self.token_url = "https://icdaccessmanagement.who.int/connect/token"
        self.api_base = "https://id.who.int/icd"

    # ── OAuth2 Token Management ─────────────────────────────────────

    def _get_access_token(self) -> str:
        """Fetch and cache an OAuth2 access token from WHO ICD API."""
        cache_key = "icd_api_token"
        cached_token = get_cache(cache_key)
        if cached_token:
            return cached_token

        if not self.client_id or not self.client_secret:
            print("[ICD API] Client ID or Secret not configured.")
            return ""

        try:
            response = requests.post(
                self.token_url,
                data={
                    "grant_type": "client_credentials",
                    "scope": "icdapi_access",
                },
                auth=(self.client_id, self.client_secret),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10
            )

            if response.status_code == 200:
                token_data = response.json()
                token = token_data.get("access_token", "")
                expires_in = token_data.get("expires_in", 3600)
                if token:
                    # Cache token for slightly less than its expiry
                    set_cache(cache_key, token, max(1, expires_in - 120))
                    print(f"[ICD API] Successfully authenticated. Token valid for {expires_in}s.")
                return token
            else:
                print(f"[ICD API] Auth failed ({response.status_code}): {response.text[:200]}")
        except Exception as e:
            print(f"[ICD API] Auth error: {e}")
        return ""

    def _authenticated_headers(self, token: str, language: str = "en") -> dict:
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Accept-Language": language,
            "API-Version": "v2"
        }

    # ── Search ICD-11 ───────────────────────────────────────────────

    def search(self, query: str, language: str = "en") -> list:
        """
        Search the ICD-11 coding system for diseases, conditions, and diagnoses.
        Returns a list of matching entities with their codes and descriptions.
        """
        cache_key = f"icd:search:{query}:{language}"
        cached = get_cache(cache_key)
        if cached:
            import json
            return json.loads(cached)

        token = self._get_access_token()
        if not token:
            return []

        try:
            url = f"{self.api_base}/release/11/2024-01/mms/search"
            params = {
                "q": query,
                "subtreeFilterUsesFoundationDescendants": "false",
                "includeKeywordResult": "true",
                "useFlexisearch": "true",
                "flatResults": "true"
            }
            res = requests.get(
                url,
                params=params,
                headers=self._authenticated_headers(token, language),
                timeout=10
            )

            if res.status_code == 200:
                data = res.json()
                results = []
                for item in data.get("destinationEntities", [])[:5]:
                    entry = {
                        "title": item.get("title", ""),
                        "code": item.get("theCode", ""),
                        "chapter": item.get("chapter", ""),
                        "score": item.get("score", 0),
                        "id": item.get("id", ""),
                    }
                    # Clean HTML from title
                    title = entry["title"]
                    if title:
                        import re
                        entry["title"] = re.sub(r'<[^>]+>', '', title)
                    results.append(entry)

                if results:
                    import json
                    set_cache(cache_key, json.dumps(results), 86400)
                return results
            else:
                print(f"[ICD API] Search failed ({res.status_code}): {res.text[:200]}")
        except Exception as e:
            print(f"[ICD API] Search error: {e}")
        return []

    def get_entity(self, entity_id: str, language: str = "en") -> dict:
        """Fetch detailed information about a specific ICD-11 entity by its URI."""
        token = self._get_access_token()
        if not token:
            return {}

        try:
            res = requests.get(
                entity_id,
                headers=self._authenticated_headers(token, language),
                timeout=10
            )
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[ICD API] Entity fetch error: {e}")
        return {}

    # ── RAG Context Generator ───────────────────────────────────────

    def get_icd_context(self, query: str, language: str = "en") -> str:
        """
        Generate a formatted context string from ICD-11 search results
        for injection into the LLM prompt.
        """
        results = self.search(query, language)
        if not results:
            return ""

        parts = [f"[WHO ICD-11 Classification] Search results for '{query}':"]
        for r in results:
            code = r.get("code", "N/A")
            title = r.get("title", "Unknown")
            chapter = r.get("chapter", "")
            line = f"  - {code}: {title}"
            if chapter:
                line += f" (Chapter: {chapter})"
            parts.append(line)

        return "\n".join(parts)

    # ── Proxy for frontend medical router ───────────────────────────

    def proxy_request(self, method: str, path: str, params: dict = None, json_data: dict = None) -> requests.Response:
        """Makes an authenticated request to the ICD API for the proxy router."""
        token = self._get_access_token()
        if not token:
            mock_res = requests.Response()
            mock_res.status_code = 401
            mock_res._content = b'{"error": "ICD API authentication failed"}'
            return mock_res

        url = f"{self.api_base}/{path.lstrip('/')}"
        return requests.request(
            method=method,
            url=url,
            params=params,
            json=json_data,
            headers=self._authenticated_headers(token),
            timeout=10
        )


icd_service = ICDService()
