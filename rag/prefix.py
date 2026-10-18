from embeddings import get_model, embed_passages
from common import QUERY_PREFIX
P = embed_passages(["Nina Fortner is the twin sister of Johan Liebert."])
q = "Who is Johan's sister?"
sans = get_model().encode(q, normalize_embeddings=True)
avec = get_model().encode(QUERY_PREFIX + q, normalize_embeddings=True)
print("sans préfixe:", P @ sans)
print("avec préfixe:", P @ avec)