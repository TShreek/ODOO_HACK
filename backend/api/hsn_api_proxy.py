from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter(tags=["HSN Search"])

HSN_API_URL = "https://services.gst.gov.in/commonservices/hsn/search/qsearch"

@router.get("/fuzzysearch/product")
async def search_hsn_code(query: str = Query(..., description="Search keyword for HSN code")):
    """
    Search HSN codes by keyword.
    """
    params = {
        "inputText": query,
        "selectedType": "byDesc" if not query.isdigit() else "byCode",
        "category": "P" if not query.isdigit() else "null"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(HSN_API_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch HSN data")

    return response.json()