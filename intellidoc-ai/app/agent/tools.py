from langchain.tools import tool
from app.rag.retriever import get_retriever

@tool
def search_knowledge_base(query: str) -> str:
    """Searches the knowledge base for relevant information."""
    retriever = get_retriever()
    docs = retriever.invoke(query)
    return "\n\n".join([doc.page_content for doc in docs])
