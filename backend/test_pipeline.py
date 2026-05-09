import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
from app.pipeline.graph import workflow
from langgraph.checkpoint.memory import MemorySaver

async def run():
    app = workflow.compile(checkpointer=MemorySaver())
    config={'configurable': {'thread_id': 'test1'}}
    state = await app.ainvoke({'molecule': 'Aspirin'}, config)
    print("PHARM:", state.get('pharmacology_data'))
    print("COMMERCIAL:", state.get('commercial_data'))

if __name__ == "__main__":
    asyncio.run(run())
