import abc 
import asyncio
import logging 
from typing import Any, Dict 
from pydantic import BaseModel 

logger = logging.getLogger(__name__) 

class BaseAgent(abc.ABC): 
    
    def __init__(self, name: str, role: str, temperature: float = 0.0):
        self.name = name
        self.role = role 
        self.temperature = temperature
        self.max_retries = 2 
        
    def log_status(self, status: str, message: str): 
        log_payload = {
            "agent": self.name, 
            "status": status, 
            "message": message
        }
        
        print(f"[{self.name} | {status.upper()}] {message}", flush=True)
        return log_payload 
    
    async def execute_with_retries(self, input_data: Any) -> Dict[str, Any]:
        self.log_status("running", "Task initiated")
        attempt = 0 
        
        while attempt <= self.max_retries: 
            try: 
                res = await self._run(input_data)
                self.log_status("done", "Task completed successfully.") 
                return res 
            
            except Exception as e: 
                attempt += 1
                if attempt > self.max_retries:
                    self.log_status("failed", f"Task failed after {self.max_retries} retries. Error: {str(e)}")
                    raise e
                    
                wait_time = 2 ** attempt 
                self.log_status("retrying", f"Error Encountered: {str(e)}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
                
    @abc.abstractmethod
    async def _run(self, input_data: Any) -> Dict[str, Any]: 
        pass 
        
    def _parse_json_safely(self, content: str) -> Dict[str, Any]:
        """Safely extracts JSON from LLM response, handling markdown code blocks and formatting."""
        import json, re
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
                
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
                
        return {}