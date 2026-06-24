from typing import List


ALERT_RULES = [
    {
        "id": "disposable_email",
        "check": lambda r: r.get("email_domain_type") == "disposable",
        "message": "Disposable email domain used",
        "severity": "high",
    },
    {
        "id": "too_fast",
        "check": lambda r: float(r.get("time_to_fill_sec", 999)) < 10,
        "message": "Form filled in under 10 seconds (bot-like speed)",
        "severity": "high",
    },
    {
        "id": "late_night",
        "check": lambda r: int(r.get("submission_hour", 12)) in [0, 1, 2, 3, 4],
        "message": "Submitted between 12AM–4AM (unusual timing)",
        "severity": "medium",
    },
    {
        "id": "ip_burst",
        "check": lambda r: int(r.get("apps_from_same_ip_1hr", 1)) >= 5,
        "message": "Multiple applications from same IP within 1 hour",
        "severity": "high",
    },
    {
        "id": "duplicate_email",
        "check": lambda r: str(r.get("is_duplicate_email", "false")).lower() == "true",
        "message": "Duplicate email detected",
        "severity": "high",
    },
    {
        "id": "duplicate_phone",
        "check": lambda r: str(r.get("is_duplicate_phone", "false")).lower() == "true",
        "message": "Duplicate phone number detected",
        "severity": "high",
    },
    {
        "id": "high_resume_similarity",
        "check": lambda r: float(r.get("resume_similarity_score", 0)) >= 0.85,
        "message": "Resume similarity score >= 0.85 (possible copy-paste)",
        "severity": "medium",
    },
    {
        "id": "invalid_cgpa",
        "check": lambda r: float(r.get("cgpa", 2.0)) < 0.5 or float(r.get("cgpa", 2.0)) > 4.0,
        "message": "CGPA out of valid range (0.5–4.0)",
        "severity": "medium",
    },
]


def evaluate_alerts(record: dict) -> List[dict]:
    triggered = []
    for rule in ALERT_RULES:
        try:
            if rule["check"](record):
                triggered.append({
                    "id":       rule["id"],
                    "message":  rule["message"],
                    "severity": rule["severity"],
                })
        except Exception:
            continue
    return triggered