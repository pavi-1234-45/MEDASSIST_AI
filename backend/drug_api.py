import os
import requests
from fastapi import APIRouter, Request, Response, HTTPException

router = APIRouter(prefix="/api/medical", tags=["Medical Data"])

RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_BASE_URL = "https://api.fda.gov"
OPENFDA_API_KEY = os.getenv("OPENFDA_API_KEY", "B0mcBJbkjGS6ajtz6pN61LTwmnczRGYGjV4fz61K")
DATAGOV_BASE_URL = "https://api.data.gov.in"
DATAGOV_API_KEY = os.getenv("DATA_GOV_IN_API_KEY")

@router.api_route("/rxnorm/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_rxnorm(path: str, request: Request):
    """
    Proxy to RxNorm REST API.
    Example: /api/medical/rxnorm/rxcui.json?name=lipitor
    Supports all RxNorm endpoints like:
    - filterByProperty: /rxcui/{rxcui}/filter
    - findActiveProducts: /rxcui/{rxcui}/active
    - findRelatedNDCs: /relatedndc
    - findRxcuiById: /rxcui?idtype=...&id=...
    - findRxcuiByString: /rxcui?name=...
    """
    url = f"{RXNORM_BASE_URL}/{path}"
    params = dict(request.query_params)
    
    try:
        req = requests.request(
            method=request.method,
            url=url,
            params=params,
            headers={"Accept": "application/json"}
        )
        return Response(content=req.content, status_code=req.status_code, media_type=req.headers.get("content-type", "application/json"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.api_route("/openfda/{path:path}", methods=["GET", "POST"])
async def proxy_openfda(path: str, request: Request):
    """
    Proxy to OpenFDA API. Automatically attaches the API key.
    Example: /api/medical/openfda/drug/event.json?search=patient.drug.medicinalproduct:aspirin
    """
    url = f"{OPENFDA_BASE_URL}/{path}"
    params = dict(request.query_params)
    params["api_key"] = OPENFDA_API_KEY
    
    try:
        req = requests.request(
            method=request.method,
            url=url,
            params=params,
            headers={"Accept": "application/json"}
        )
        return Response(content=req.content, status_code=req.status_code, media_type=req.headers.get("content-type", "application/json"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.api_route("/datagov/{path:path}", methods=["GET", "POST"])
async def proxy_datagov(path: str, request: Request):
    """
    Proxy to Data.gov.in API. Automatically attaches the API key.
    Example: /api/medical/datagov/resource/{resource_id}?format=json&limit=10
    """
    if not DATAGOV_API_KEY:
        raise HTTPException(status_code=500, detail="Data.gov.in API key is not configured.")
        
    url = f"{DATAGOV_BASE_URL}/{path}"
    params = dict(request.query_params)
    params["api-key"] = DATAGOV_API_KEY
    
    try:
        req = requests.request(
            method=request.method,
            url=url,
            params=params,
            headers={"Accept": "application/json"}
        )
        return Response(content=req.content, status_code=req.status_code, media_type=req.headers.get("content-type", "application/json"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
