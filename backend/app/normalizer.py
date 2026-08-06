import re
import unicodedata

def normalize_text(text: str) -> str:
    if not text:
        return ""
    # Unicode normalization
    text = unicodedata.normalize("NFKC", text)
    # Lowercase English characters (this doesn't affect Tamil)
    text = text.lower()
    # Remove limited outer punctuation (we strip standard punctuation from the ends)
    text = text.strip('.,!?;:"\'')
    # Collapse repeated whitespace
    text = re.sub(r'\s+', ' ', text)
    # Trim whitespace
    text = text.strip()
    return text
