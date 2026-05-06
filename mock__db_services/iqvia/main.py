from fastapi import FastAPI
import asyncio
from pydantic import BaseModel
from typing import List 

app = FastAPI(title="Mock IQVIA Insights API") 

class MarketRequest(BaseModel): 
    diseases: List[str] 
    
@app.post("/api/v1/market-data")
async def get_market_data(req: MarketRequest): 
    await asyncio.sleep(1.5)
    
    res = [] 
    for disease in req.diseases: 
        if "diabetes" in disease.lower() or "pcos" in disease.lower(): 
            tam = 4500000000
            cagr = "6.2%"
        elif "oncology" in disease.lower(): 
            tam = 8500000000
            cagr = "8.4%" 
        else: 
            tam = 150000000
            cagr = "1.1%"
        
        res.append({
            "disease_name": disease, 
            "est_tam_usd": tam, 
            "cagr_5yr": cagr, 
            "generic_competition_level": "Medium"
        }) 
        
    return {"data": res} 