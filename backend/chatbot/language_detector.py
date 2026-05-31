def detect_message_language(text: str) -> str:
    text = (text or "").strip().lower()

    if not text:
        return "en"

    if any("\u0600" <= ch <= "\u06FF" for ch in text):
        return "ar"

    darija_markers = [
        "wach", "kifh", "kifach", "kifah", "3andi", "3indi", "andi",
        "rani", "kho", "khoya", "saha", "sah", "bzaf", "bezzaf",
        "machi", "ma3lich", "ma3lich", "nn", "ih", "ouii",

        "7ka", "7aka", "hak", "thak", "t7ak", "y7ak",
        "hamra", "7mara", "hmara", "i7mirar", "ihmirar",
        "jfaf", "jafaf", "nachef", "nashaf",
        "hboub", "7boub", "hab", "boutons",
        "bo9a", "bo93a", "tache",
        "wja3", "wje3", "yewja3", "wja3ni",
        "waram", "warma", "nafakh", "nfakh",
        "khala", "khal", "grain",
        "jeld", "jeldi", "jilda",
        "yadi", "ydi", "idi", "yed", "main",
        "rejli", "wajhi", "wejhi", "ras", "dhri",

        "9chour", "ta9achor", "9i7", "9ih", "pus",
        "tatnchar", "tntchar", "tspreadi",
        "skhana", "s5ana", "fiha skhana"
    ]

    if any(word in text for word in darija_markers):
        return "ar"

    fr_markers = [
        "bonjour", "salut", "peau", "rougeur", "démangeaison",
        "demangeaison", "sécheresse", "secheresse", "traitement",
        "maladie", "bouton", "visage", "douleur", "pourquoi",
        "comment", "ça", "ca", "est-ce"
    ]

    if any(word in text for word in fr_markers):
        return "fr"

    return "en"


def detect_tts_lang(text):
    lang = detect_message_language(text)

    if lang == "ar":
        return "ar-SA"
    if lang == "fr":
        return "fr-FR"
    return "en-US"