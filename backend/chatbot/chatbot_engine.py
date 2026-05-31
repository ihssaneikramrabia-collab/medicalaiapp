from chatbot.triage import honest_safety_triage, generate_follow_up_questions
from chatbot.groq_api import safe_ai_chat


def extract_conditions_from_kb(kb_context, lang="en"):
    conditions = []

    if not kb_context:
        return conditions

    translations = {
        "Eczema": {"ar": "الأكزيما", "fr": "Eczéma"},
        "Dermatitis": {"ar": "التهاب الجلد", "fr": "Dermatite"},
        "Psoriasis": {"ar": "الصدفية", "fr": "Psoriasis"},
        "Drug Eruption": {"ar": "طفح دوائي", "fr": "Éruption médicamenteuse"},
        "Insect Bites": {"ar": "لدغات الحشرات", "fr": "Piqûres d’insectes"},
        "Melanoma": {"ar": "الميلانوما", "fr": "Mélanome"},
        "Candidiasis": {"ar": "داء المبيضات", "fr": "Candidose"},
        "Tinea": {"ar": "فطريات الجلد", "fr": "Mycose"},
        "Acne": {"ar": "حب الشباب", "fr": "Acné"},
        "Warts": {"ar": "الثآليل", "fr": "Verrues"},
        "Vitiligo": {"ar": "البهاق", "fr": "Vitiligo"}
    }

    for line in kb_context.splitlines():
        line = line.strip()

        if line.lower().startswith("condition:"):
            condition = line.replace("Condition:", "").strip()

            if not condition:
                continue

            if lang in ["ar", "fr"]:
                condition = translations.get(condition, {}).get(lang, condition)

            if condition not in conditions:
                conditions.append(condition)

    return conditions


def local_smart_fallback(message, triage, kb_context="", scan_context="", lang="en"):
    conditions = extract_conditions_from_kb(kb_context, lang)

    if lang == "ar":
        if conditions:
            return (
                f"حسب الأعراض التي ذكرتها، قد تكون الحالات الأقرب مرتبطة بـ: {', '.join(conditions[:3])}.\n\n"
                f"{triage['safe_message']}\n\n"
                "نصائح مؤقتة: حافظ على نظافة المنطقة، تجنب الحك، استعمل منتجات لطيفة، وراقب هل تنتشر الأعراض أو تزيد.\n\n"
                "أسئلة مهمة: منذ متى بدأت الأعراض؟ هل توجد حكة، ألم، قيح، أو حرارة؟ وهل البقعة تكبر أو تغير لونها؟\n\n"
                f"{triage['disclaimer']}"
            )

        return (
            "مرحباً. لم أستطع تحديد حالة جلدية محددة من رسالتك فقط.\n\n"
            "من فضلك وضّح لي: أين توجد المشكلة؟ هل هناك حكة، احمرار، جفاف، ألم، قشور أو قيح؟ ومنذ متى بدأت؟\n\n"
            f"{triage['safe_message']}\n\n{triage['disclaimer']}"
        )

    if lang == "fr":
        if conditions:
            return (
                f"D’après les symptômes décrits, les conditions possibles peuvent être liées à : {', '.join(conditions[:3])}.\n\n"
                f"{triage['safe_message']}\n\n"
                "Conseils temporaires : gardez la zone propre, évitez de gratter, utilisez des produits doux et surveillez l’évolution.\n\n"
                "Questions utiles : depuis quand les symptômes ont-ils commencé ? Y a-t-il démangeaison, douleur, pus ou fièvre ? La tache s’étend-elle ou change-t-elle de couleur ?\n\n"
                f"{triage['disclaimer']}"
            )

        return (
            "Bonjour. Je ne peux pas identifier une condition cutanée précise avec ce message seul.\n\n"
            "Pouvez-vous préciser : la localisation, la couleur, la durée, et s’il y a démangeaison, douleur, sécheresse, squames ou pus ?\n\n"
            f"{triage['safe_message']}\n\n{triage['disclaimer']}"
        )

    if conditions:
        return (
            f"Based on the symptoms you described, possible related conditions may include: {', '.join(conditions[:3])}.\n\n"
            f"{triage['safe_message']}\n\n"
            "Temporary advice: keep the area clean, avoid scratching, use gentle skincare products, and monitor whether symptoms spread or worsen.\n\n"
            "Useful questions: when did it start? Is there itching, pain, pus, fever, dryness, or scaling? Is the spot growing or changing color?\n\n"
            f"{triage['disclaimer']}"
        )

    return (
        "Hello. I could not identify a specific skin condition from this message alone.\n\n"
        "Please describe where it is, the color, how long it has been there, and whether there is itching, pain, dryness, scaling, pus, or swelling.\n\n"
        f"{triage['safe_message']}\n\n{triage['disclaimer']}"
    )


def generate_chat_reply(message, kb_context="", scan_context="", relevance=0):
    triage = honest_safety_triage(message)
    lang = triage["detected_language"]

    small_talk = [
        "hi",
        "hello",
        "hey",
        "bonjour",
        "salut",
        "salam",
        "slm",
        "السلام عليكم",
        "مرحبا"
    ]

    if message.lower().strip() in small_talk:
        replies = {
            "ar": "مرحباً 👋 كيف يمكنني مساعدتك بخصوص مشكلة جلدية؟",
            "fr": "Bonjour 👋 Comment puis-je vous aider concernant un problème de peau ?",
            "en": "Hello 👋 How can I help you with a skin concern?"
        }

        return {
            "reply": replies.get(lang, replies["en"]),
            "mode": "small_talk",
            "detected_language": lang,
            "triage_level": "none",
            "matched_red_flags": [],
            "matched_medium_flags": [],
            "follow_up_questions": [],
            "disclaimer": ""
        }

    follow_up_questions = generate_follow_up_questions(
        triage["triage_level"],
        lang
    )

    language_rule = {
        "ar": "Reply ONLY in Arabic. Use clear simple Arabic, friendly for Algerian users. Do not switch to French or English.",
        "fr": "Réponds UNIQUEMENT en français clair. Ne change pas de langue.",
        "en": "Reply ONLY in clear English. Do not switch language."
    }.get(lang, "Reply ONLY in clear English.")

    system_prompt = f"""
You are an honest and safe dermatology assistant.

CRITICAL RULES:
- Do NOT give a final diagnosis.
- Do NOT scare the user.
- Do NOT hide danger.
- Be honest, calm, and medically cautious.
- If risk is high, recommend prompt medical evaluation without saying "you have cancer".
- Always explain that this is educational support only.
- Use the same language as the user.
- Use the knowledge base context if it contains matching conditions.
- If the message is vague, ask clarification questions.

Detected language: {lang}
Triage level: {triage["triage_level"]}
Safety message: {triage["safe_message"]}
Disclaimer: {triage["disclaimer"]}
Skin relevance score: {relevance}

Knowledge base context:
{kb_context}

Last scan context:
{scan_context}

{language_rule}
"""

    fallback_reply = local_smart_fallback(
        message=message,
        triage=triage,
        kb_context=kb_context,
        scan_context=scan_context,
        lang=lang
    )

    reply = safe_ai_chat(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
        fallback=fallback_reply
    )

    return {
        "reply": reply,
        "mode": "honest_safety_dermatology",
        "detected_language": lang,
        "triage_level": triage["triage_level"],
        "matched_red_flags": triage["matched_red_flags"],
        "matched_medium_flags": triage["matched_medium_flags"],
        "follow_up_questions": follow_up_questions,
        "disclaimer": triage["disclaimer"]
    }