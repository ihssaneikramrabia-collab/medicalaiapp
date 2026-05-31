from chatbot.language_detector import detect_message_language


DANGER_TERMS = [
    "difficulty breathing", "swollen face", "fever with rash", "rapid spreading",
    "severe pain", "bleeding mole", "changing mole", "black spot",
    "difficulté à respirer", "difficulte a respirer", "visage gonflé",
    "visage gonfle", "fièvre", "fievre", "se propage rapidement",
    "douleur intense", "grain de beauté qui saigne", "tache noire",
    "صعوبة التنفس", "تورم الوجه", "حمى", "ينتشر بسرعة", "ألم شديد",
    "نزيف", "شامة تتغير", "شامة تنزف", "بقعة سوداء تكبر",
    "nfs ma9derch", "ma9dertch ntnefes", "wajhi waram", "skhana",
    "tatnchar bzaf", "wja3 kbir", "khala tbedlet", "khala tssil dem",
    "bo9a k7la"
]

MEDIUM_TERMS = [
    "pus", "pain", "strong itching", "not improving", "spreading",
    "douleur", "démangeaison forte", "demangeaison forte", "ne s'améliore pas",
    "قيح", "ألم", "حكة قوية", "ما تحسنتش", "ينتشر",
    "kayen 9i7", "wja3", "7ka bzaf", "mat7snetch", "tatnchar"
]


def honest_safety_triage(message):
    text = (message or "").lower()
    lang = detect_message_language(text)

    high_hits = [term for term in DANGER_TERMS if term.lower() in text]
    medium_hits = [term for term in MEDIUM_TERMS if term.lower() in text]

    if high_hits:
        level = "high"
    elif medium_hits:
        level = "medium"
    else:
        level = "low"

    messages = {
        "ar": {
            "low": "الأعراض اللي ذكرتها تبدو غالبًا غير مستعجلة، لكن لازم تراقبها. إذا زادت، انتشرت، أو ظهر ألم/قيح/حمى، الأفضل تستشير طبيب جلد.",
            "medium": "الأعراض تحتاج متابعة طبية خلال الأيام القادمة، خاصة إذا كاين ألم، قيح، انتشار، أو الحالة ما تحسنتش.",
            "high": "الأعراض اللي ذكرتها فيها علامات تستحق تقييم طبي سريع. هذا لا يعني بالضرورة مرض خطير، لكن من الأفضل التواصل مع طبيب أو استعجالات في أقرب وقت."
        },
        "fr": {
            "low": "Les symptômes semblent probablement non urgents, mais il faut les surveiller. Si cela s’aggrave, s’étend, ou s’accompagne de douleur, pus ou fièvre, consultez un dermatologue.",
            "medium": "Les symptômes méritent un avis médical dans les prochains jours, surtout s’il y a douleur, pus, extension ou absence d’amélioration.",
            "high": "Les symptômes mentionnés contiennent des signes qui méritent une évaluation médicale rapide. Cela ne veut pas forcément dire que c’est grave, mais il vaut mieux consulter rapidement."
        },
        "en": {
            "low": "The symptoms sound likely non-urgent, but they should be monitored. If they worsen, spread, or include pain, pus, or fever, consult a dermatologist.",
            "medium": "These symptoms deserve medical follow-up in the next few days, especially if there is pain, pus, spreading, or no improvement.",
            "high": "The symptoms you mentioned include warning signs that deserve prompt medical evaluation. This does not necessarily mean something severe, but it is safer to seek medical advice quickly."
        }
    }

    disclaimers = {
        "ar": "هذا التقييم للتوعية فقط ولا يعتبر تشخيصًا طبيًا نهائيًا.",
        "fr": "Cette réponse est éducative et ne remplace pas un diagnostic médical.",
        "en": "This is educational support only and not a final medical diagnosis."
    }

    safe_lang = lang if lang in messages else "en"

    return {
        "triage_level": level,
        "detected_language": safe_lang,
        "matched_red_flags": high_hits,
        "matched_medium_flags": medium_hits,
        "safe_message": messages[safe_lang][level],
        "disclaimer": disclaimers[safe_lang]
    }


def generate_follow_up_questions(triage_level, lang):
    if lang == "ar":
        if triage_level == "high":
            return [
                "هل كاين صعوبة في التنفس أو تورم في الوجه؟",
                "هل الطفح ينتشر بسرعة؟",
                "هل كاين حمى أو ألم شديد؟"
            ]
        return [
            "منذ متى بدأت الأعراض؟",
            "هل كاين حكة، ألم، أو قيح؟",
            "هل البقعة تكبر أو تبدل لونها؟"
        ]

    if lang == "fr":
        if triage_level == "high":
            return [
                "Y a-t-il une difficulté à respirer ou un gonflement du visage ?",
                "L’éruption se propage-t-elle rapidement ?",
                "Y a-t-il fièvre ou douleur intense ?"
            ]
        return [
            "Depuis quand les symptômes ont-ils commencé ?",
            "Y a-t-il démangeaison, douleur ou pus ?",
            "La tache grandit-elle ou change-t-elle de couleur ?"
        ]

    if triage_level == "high":
        return [
            "Is there difficulty breathing or facial swelling?",
            "Is the rash spreading rapidly?",
            "Is there fever or severe pain?"
        ]

    return [
        "When did the symptoms start?",
        "Is there itching, pain, or pus?",
        "Is the spot growing or changing color?"
    ]