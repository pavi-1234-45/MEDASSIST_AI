import requests
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from app.config.settings import settings
from app.security.auth import get_current_user
from app.services.medi_service import icd_service

router = APIRouter(prefix="/api/medical", tags=["Medical Data"])

RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_BASE_URL = "https://api.fda.gov"
DATAGOV_BASE_URL = "https://api.data.gov.in"

@router.api_route("/rxnorm/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_rxnorm(path: str, request: Request, current_user: dict = Depends(get_current_user)):
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
async def proxy_openfda(path: str, request: Request, current_user: dict = Depends(get_current_user)):
    url = f"{OPENFDA_BASE_URL}/{path}"
    params = dict(request.query_params)
    params["api_key"] = settings.OPENFDA_API_KEY
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
async def proxy_datagov(path: str, request: Request, current_user: dict = Depends(get_current_user)):
    if not settings.DATA_GOV_IN_API_KEY:
        raise HTTPException(status_code=500, detail="Data.gov.in API key is not configured.")
        
    url = f"{DATAGOV_BASE_URL}/{path}"
    params = dict(request.query_params)
    params["api-key"] = settings.DATA_GOV_IN_API_KEY
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

@router.api_route("/medi/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_medi(path: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Proxy for the custom Medi API using Client ID and Secret."""
    params = dict(request.query_params)
    json_data = None
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            json_data = await request.json()
        except:
            pass

    try:
        req = icd_service.proxy_request(
            method=request.method,
            path=path,
            params=params,
            json_data=json_data
        )
        return Response(
            content=req.content, 
            status_code=req.status_code, 
            media_type=req.headers.get("content-type", "application/json")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
