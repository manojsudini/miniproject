from collections import Counter
from datetime import datetime
from functools import lru_cache
import os
import re

from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

print("Loading ATS model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("ATS model loaded!")
EMBEDDING_DIMENSION = model.get_sentence_embedding_dimension()
EMBEDDING_OPTIONS = {
    "convert_to_numpy": True,
    "normalize_embeddings": True,
    "show_progress_bar": False,
}
ATS_VERBOSE_DEBUG = os.getenv("ATS_VERBOSE_DEBUG", "0") == "1"


def format_debug_datetime(value):
    if not value:
        return "Unknown"

    if isinstance(value, datetime):
        parsed_value = value
    elif isinstance(value, str):
        try:
            parsed_value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value
    else:
        return str(value)

    return parsed_value.strftime("%d/%b/%Y %I:%M:%S %p")


SKILL_TAXONOMY = {
    "python": ["python"],
    "java": ["java"],
    "javascript": ["javascript"],
    "typescript": ["typescript"],
    "c": ["c language", "programming in c"],
    "c++": ["c++", "cpp", "cplusplus", "c plus plus"],
    "c#": ["c#", "csharp", "c sharp"],
    "go": ["golang", "go language"],
    "php": ["php"],
    "ruby": ["ruby"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "bootstrap": ["bootstrap"],
    "tailwind": ["tailwind", "tailwind css"],
    "react": ["react", "reactjs", "react js"],
    "next.js": ["nextjs", "next js", "next.js"],
    "angular": ["angular", "angularjs", "angular js"],
    "vue": ["vue", "vuejs", "vue js"],
    "node.js": ["node", "nodejs", "node js", "node.js"],
    "express": ["express", "expressjs", "express js", "express.js"],
    "django": ["django"],
    "flask": ["flask"],
    "fastapi": ["fastapi", "fast api"],
    "spring": ["spring"],
    "spring boot": ["spring boot", "springboot"],
    ".net": [".net", "dotnet", "asp.net", "asp net"],
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "mongodb": ["mongodb", "mongo db", "mongo"],
    "redis": ["redis"],
    "firebase": ["firebase"],
    "rest api": ["rest api", "restful api", "restful services"],
    "graphql": ["graphql"],
    "microservices": ["microservices", "micro services"],
    "api testing": ["api testing", "postman", "swagger"],
    "git": ["git", "github", "gitlab", "bitbucket", "version control"],
    "docker": ["docker", "containerization"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "google cloud platform"],
    "ci/cd": ["ci cd", "cicd", "continuous integration", "continuous deployment"],
    "linux": ["linux", "unix"],
    "selenium": ["selenium"],
    "pytest": ["pytest", "py test"],
    "junit": ["junit", "j unit"],
    "automation testing": ["automation testing", "test automation"],
    "manual testing": ["manual testing"],
    "debugging": ["debugging", "troubleshooting"],
    "data structures": ["data structures", "dsa"],
    "algorithms": ["algorithms", "algorithm design"],
    "system design": ["system design", "high level design", "hld", "design patterns"],
    "oop": ["oop", "oops", "object oriented programming"],
    "problem solving": ["problem solving", "analytical thinking"],
    "agile": ["agile", "scrum", "kanban"],
    "machine learning": ["machine learning", "ml"],
    "data analysis": ["data analysis", "data analytics"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "excel": ["excel", "advanced excel"],
    "communication": ["communication", "stakeholder management"],
}


ROLE_PROFILES = {
    "software developer": [
        "python",
        "java",
        "javascript",
        "typescript",
        "sql",
        "git",
        "rest api",
        "data structures",
        "algorithms",
        "system design",
        "oop",
        "problem solving",
        "agile",
        "react",
        "node.js",
        "django",
        "spring boot",
        "mongodb",
        "mysql",
        "docker",
        "debugging",
        "software development",
        "backend",
        "frontend",
    ],
    "frontend developer": [
        "react",
        "next.js",
        "angular",
        "vue",
        "javascript",
        "typescript",
        "html",
        "css",
        "bootstrap",
        "tailwind",
        "frontend",
        "ui",
        "responsive",
    ],
    "backend developer": [
        "node.js",
        "express",
        "python",
        "java",
        "spring boot",
        "django",
        "flask",
        "fastapi",
        "sql",
        "postgresql",
        "mongodb",
        "rest api",
        "microservices",
        "backend",
        "server",
    ],
    "full stack developer": [
        "react",
        "next.js",
        "javascript",
        "typescript",
        "node.js",
        "express",
        "python",
        "java",
        "sql",
        "mongodb",
        "rest api",
        "debugging",
        "agile",
        "system design",
        "frontend",
        "backend",
        "full stack",
    ],
    "software tester": [
        "selenium",
        "pytest",
        "junit",
        "automation testing",
        "manual testing",
        "api testing",
        "debugging",
        "qa",
        "test cases",
        "quality assurance",
    ],
    "devops engineer": [
        "docker",
        "kubernetes",
        "aws",
        "azure",
        "gcp",
        "ci/cd",
        "linux",
        "terraform",
        "deployment",
        "monitoring",
        "devops",
    ],
    "data analyst": [
        "sql",
        "python",
        "excel",
        "power bi",
        "tableau",
        "data analysis",
        "statistics",
        "analytics",
        "dashboard",
        "reporting",
    ],
}


ROLE_ALIASES = {
    "software engineer": "software developer",
    "frontend engineer": "frontend developer",
    "backend engineer": "backend developer",
    "full stack engineer": "full stack developer",
    "qa engineer": "software tester",
    "quality assurance engineer": "software tester",
    "quality assurance": "software tester",
    "ui ux designer": "ui/ux designer",
    "ui designer": "ui/ux designer",
    "ux designer": "ui/ux designer",
}


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
    "will",
    "this",
    "their",
    "our",
    "your",
    "into",
    "over",
    "using",
    "use",
    "used",
    "should",
    "must",
    "need",
    "needs",
    "required",
    "requirement",
    "requirements",
    "experience",
    "years",
    "year",
    "strong",
    "good",
    "ability",
    "knowledge",
    "skills",
    "skill",
    "candidate",
    "candidates",
    "role",
    "job",
    "work",
    "working",
    "team",
}


REPLACEMENTS = {
    "node.js": "nodejs",
    "node js": "nodejs",
    "react.js": "react",
    "react js": "react",
    "next.js": "nextjs",
    "next js": "nextjs",
    "express.js": "express",
    "express js": "express",
    "restful api": "rest api",
    "restful services": "rest api",
    "api's": "api",
    "c plus plus": "cplusplus",
    "c sharp": "csharp",
    "c#": "csharp",
    ".net": "dotnet",
    "asp.net": "asp dotnet",
    "ci/cd": "ci cd",
    "powerbi": "power bi",
}


REQUIRED_MARKERS = [
    "must have",
    "must",
    "required",
    "mandatory",
    "essential",
    "should have",
    "hands on",
    "hands-on",
    "proficient in",
    "experience with",
    "strong in",
]


EXPERIENCE_SECTION_MARKERS = {
    "experience",
    "work experience",
    "professional experience",
    "project experience",
    "projects",
    "project",
    "internship",
    "internships",
}


NON_EXPERIENCE_SECTION_MARKERS = {
    "education",
    "skills",
    "technical skills",
    "certifications",
    "summary",
    "profile",
    "objective",
    "achievements",
    "hobbies",
    "languages",
    "personal details",
}


ACTION_VERBS = {
    "applied",
    "automated",
    "built",
    "collaborated",
    "created",
    "debugged",
    "defined",
    "delivered",
    "deployed",
    "designed",
    "developed",
    "engineered",
    "implemented",
    "improved",
    "integrated",
    "maintained",
    "optimized",
    "resolved",
    "tested",
    "used",
    "worked",
}


ROLE_INTENT_PATTERNS = [
    "target role {role}",
    "target position {role}",
    "seeking {role}",
    "seeking a {role}",
    "seeking an {role}",
    "applying for {role}",
    "career objective {role}",
    "objective {role}",
]

@lru_cache(maxsize=8192)
def normalize_text(text):
    if not text:
        return ""

    normalized = text.lower()

    for source, target in REPLACEMENTS.items():
        normalized = normalized.replace(source, target)

    normalized = re.sub(r"[^a-z0-9\s+]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)

    return normalized.strip()


def normalize_role_name(role_name):
    normalized_role = normalize_text(role_name)
    return ROLE_ALIASES.get(normalized_role, normalized_role)


NORMALIZED_ROLE_PROFILES = {
    role_name: tuple(
        normalized_keyword
        for keyword in keywords
        for normalized_keyword in [normalize_text(keyword)]
        if normalized_keyword
    )
    for role_name, keywords in ROLE_PROFILES.items()
}


def build_alias_patterns():
    alias_patterns = {}

    for canonical_skill, aliases in SKILL_TAXONOMY.items():
        normalized_aliases = {normalize_text(canonical_skill)}
        normalized_aliases.update(normalize_text(alias) for alias in aliases)
        normalized_aliases.discard("")

        patterns = [
            re.compile(rf"(?<!\w){re.escape(alias)}(?!\w)")
            for alias in sorted(normalized_aliases, key=len, reverse=True)
        ]

        alias_patterns[canonical_skill] = patterns

    return alias_patterns


SKILL_PATTERNS = build_alias_patterns()


@lru_cache(maxsize=4096)
def split_text_segments(text):
    raw_segments = re.split(r"(?:\n+|(?<=[.!?])\s+)", text or "")
    return tuple(
        segment.strip() for segment in raw_segments if segment and segment.strip()
    )


@lru_cache(maxsize=4096)
def build_chunks(text, chunk_size=80, overlap=20, max_chunks=6):
    segments = [normalize_text(segment) for segment in split_text_segments(text)]
    segments = [segment for segment in segments if segment]

    if not segments:
        return tuple()

    chunks = []
    buffer = []

    for segment in segments:
        words = segment.split()

        if not words:
            continue

        if len(words) >= chunk_size:
            if buffer:
                chunks.append(" ".join(buffer))
                buffer = []

            for start in range(0, len(words), max(1, chunk_size - overlap)):
                chunk_words = words[start : start + chunk_size]

                if chunk_words:
                    chunks.append(" ".join(chunk_words))

                if len(chunks) >= max_chunks:
                    return tuple(chunks[:max_chunks])

            continue

        if len(buffer) + len(words) > chunk_size and buffer:
            chunks.append(" ".join(buffer))

            if len(chunks) >= max_chunks:
                return tuple(chunks[:max_chunks])

            buffer = buffer[-overlap:] if overlap and len(buffer) > overlap else buffer[:]

        buffer.extend(words)

    if buffer and len(chunks) < max_chunks:
        chunks.append(" ".join(buffer))

    return tuple(chunks[:max_chunks])


@lru_cache(maxsize=8192)
def extract_skill_evidence(text):
    normalized_text = normalize_text(text)
    evidence = {}

    for canonical_skill, patterns in SKILL_PATTERNS.items():
        occurrences = 0

        for pattern in patterns:
            matches = pattern.findall(normalized_text)
            if matches:
                occurrences += len(matches)

        if occurrences:
            evidence[canonical_skill] = occurrences

    return evidence


def extract_skills(text):
    return sorted(extract_skill_evidence(text).keys())


@lru_cache(maxsize=4096)
def extract_required_skills(job_description):
    required_skills = set()

    for segment in split_text_segments(job_description):
        normalized_segment = normalize_text(segment)

        if any(marker in normalized_segment for marker in REQUIRED_MARKERS):
            required_skills.update(extract_skills(normalized_segment))

    return required_skills


def build_skill_weights(job_description, jd_skill_evidence, required_skills):
    normalized_jd = normalize_text(job_description)
    weights = {}

    for skill, count in jd_skill_evidence.items():
        weight = 1.0 + min(0.45, (count - 1) * 0.15)

        if skill in required_skills:
            weight += 0.85

        if normalized_jd.startswith(normalize_text(skill)):
            weight += 0.1

        weights[skill] = round(weight, 2)

    return weights


def sort_skills(skills, skill_weights):
    return sorted(skills, key=lambda skill: (-skill_weights.get(skill, 1.0), skill))


def compute_weighted_skill_score(skill_weights, resume_skill_evidence):
    if not skill_weights:
        return 0.0, [], []

    matched_skills = [skill for skill in skill_weights if skill in resume_skill_evidence]
    missing_skills = [skill for skill in skill_weights if skill not in resume_skill_evidence]

    total_weight = sum(skill_weights.values())
    matched_weight = sum(skill_weights[skill] for skill in matched_skills)
    score = (matched_weight / total_weight) * 100 if total_weight else 0.0

    return round(float(score), 2), matched_skills, missing_skills


def compute_required_skill_score(required_skills, resume_skill_evidence):
    if not required_skills:
        return 0.0, []

    matched_required = [skill for skill in required_skills if skill in resume_skill_evidence]
    missing_required = [skill for skill in required_skills if skill not in resume_skill_evidence]
    score = (len(matched_required) / len(required_skills)) * 100 if required_skills else 0.0

    return round(float(score), 2), missing_required


@lru_cache(maxsize=4096)
def extract_keyword_counter(text, top_n=40):
    tokens = [
        token
        for token in normalize_text(text).split()
        if len(token) > 2 and token not in STOP_WORDS and not token.isdigit()
    ]

    return Counter(dict(Counter(tokens).most_common(top_n)))


def compute_keyword_overlap(job_description, resume_text):
    jd_keywords = extract_keyword_counter(job_description)
    resume_keywords = extract_keyword_counter(resume_text)

    if not jd_keywords:
        return 0.0

    total_weight = sum(jd_keywords.values())
    matched_weight = sum(
        min(weight, resume_keywords.get(keyword, 0))
        for keyword, weight in jd_keywords.items()
    )

    return round(float((matched_weight / total_weight) * 100), 2)


@lru_cache(maxsize=32768)
def has_phrase(normalized_text, phrase):
    normalized_phrase = normalize_text(phrase)

    if not normalized_text or not normalized_phrase:
        return False

    return f" {normalized_phrase} " in f" {normalized_text} "


@lru_cache(maxsize=256)
def get_role_variants(role_name):
    normalized_role = normalize_role_name(role_name)

    if not normalized_role:
        return tuple()

    variants = {normalized_role}
    variants.update(alias for alias, canonical in ROLE_ALIASES.items() if canonical == normalized_role)

    return tuple(sorted(variant for variant in variants if variant))


def compute_role_phrase_bonus(normalized_resume, role_name):
    best_bonus = 0.0

    for variant in get_role_variants(role_name):
        if has_phrase(normalized_resume, variant):
            bonus = 14.0

            if any(
                has_phrase(normalized_resume, pattern.format(role=variant))
                for pattern in ROLE_INTENT_PATTERNS
            ):
                bonus += 14.0

            best_bonus = max(best_bonus, bonus)

    return best_bonus


@lru_cache(maxsize=4096)
def extract_experience_like_segments(text):
    if not text:
        return tuple()

    segments = []
    in_experience_section = False

    for raw_line in text.splitlines():
        stripped_line = raw_line.strip()
        normalized_line = normalize_text(stripped_line)

        if not normalized_line:
            continue

        if normalized_line in EXPERIENCE_SECTION_MARKERS:
            in_experience_section = True
            continue

        if normalized_line in NON_EXPERIENCE_SECTION_MARKERS:
            in_experience_section = False
            continue

        is_bullet = bool(re.match(r"^\s*(?:[-*]|[0-9]+[.)])\s+", raw_line))
        has_action_verb = any(
            normalized_line.startswith(f"{verb} ") or f" {verb} " in normalized_line
            for verb in ACTION_VERBS
        )

        if in_experience_section or is_bullet or has_action_verb:
            segments.append(stripped_line)

    if segments:
        return tuple(segments[:40])

    fallback_segments = []

    for segment in split_text_segments(text):
        normalized_segment = normalize_text(segment)

        if any(
            normalized_segment.startswith(f"{verb} ")
            or f" {verb} " in normalized_segment
            for verb in ACTION_VERBS
        ):
            fallback_segments.append(segment)

    return tuple(fallback_segments[:40])


def compute_experience_alignment(resume_text, skill_weights):
    if not skill_weights:
        return 0.0, []

    experience_segments = extract_experience_like_segments(resume_text)

    if not experience_segments:
        return 0.0, []

    experience_skill_evidence = extract_skill_evidence("\n".join(experience_segments))

    if not experience_skill_evidence:
        return 0.0, []

    matched_skills = [skill for skill in skill_weights if skill in experience_skill_evidence]
    total_weight = sum(skill_weights.values())
    matched_weight = 0.0

    for skill in matched_skills:
        repeat_multiplier = min(1.35, 1.0 + ((experience_skill_evidence[skill] - 1) * 0.12))
        matched_weight += skill_weights[skill] * repeat_multiplier

    score = min(100.0, (matched_weight / total_weight) * 100) if total_weight else 0.0

    return round(float(score), 2), sort_skills(matched_skills, skill_weights)


def score_role_profile(normalized_jd, normalized_resume, role_name):
    keywords = NORMALIZED_ROLE_PROFILES.get(role_name, ())
    matched_jd = [
        keyword for keyword in keywords if has_phrase(normalized_jd, keyword)
    ]
    matched_resume = [
        keyword for keyword in matched_jd if has_phrase(normalized_resume, keyword)
    ]
    base_score = (len(matched_resume) / len(matched_jd)) * 100 if matched_jd else 0.0
    phrase_bonus = compute_role_phrase_bonus(normalized_resume, role_name)
    score = min(100.0, base_score + phrase_bonus)

    return {
        "matched_jd": matched_jd,
        "matched_resume": matched_resume,
        "phrase_bonus": round(float(phrase_bonus), 2),
        "score": round(float(score), 2),
    }


def compute_role_alignment(job_description, resume_text, target_role=None):
    normalized_jd = normalize_text(job_description)
    normalized_resume = normalize_text(resume_text)
    role_scores = {}

    for role_name in ROLE_PROFILES:
        role_data = score_role_profile(normalized_jd, normalized_resume, role_name)

        if role_data["matched_jd"]:
            role_scores[role_name] = role_data

    inferred_role = None

    if role_scores:
        inferred_role = max(
            role_scores,
            key=lambda role_name: (
                len(role_scores[role_name]["matched_resume"]),
                len(role_scores[role_name]["matched_jd"]),
            ),
        )

    normalized_target_role = normalize_role_name(target_role) if target_role else None

    if normalized_target_role and normalized_target_role in ROLE_PROFILES:
        target_role_data = score_role_profile(
            normalized_jd,
            normalized_resume,
            normalized_target_role,
        )

        return (
            target_role_data["score"],
            normalized_target_role,
            inferred_role,
        )

    if not inferred_role:
        return 0.0, None, None

    return (
        role_scores[inferred_role]["score"],
        inferred_role,
        inferred_role,
    )


@lru_cache(maxsize=8192)
def get_text_embedding(text):
    normalized_text = normalize_text(text)

    if not normalized_text:
        return np.zeros(EMBEDDING_DIMENSION, dtype=np.float32)

    return model.encode(normalized_text, **EMBEDDING_OPTIONS)


@lru_cache(maxsize=4096)
def get_embedding_matrix(texts):
    if not texts:
        return np.empty((0, EMBEDDING_DIMENSION), dtype=np.float32)

    return np.vstack([get_text_embedding(text) for text in texts])


def compute_semantic_score(job_description, resume_text):
    jd_chunks = build_chunks(job_description, chunk_size=72, overlap=18, max_chunks=4)
    resume_chunks = build_chunks(resume_text, chunk_size=110, overlap=24, max_chunks=8)
    jd_document_embedding = get_text_embedding(job_description)
    resume_document_embedding = get_text_embedding(resume_text)
    jd_chunk_embeddings = get_embedding_matrix(jd_chunks)
    resume_chunk_embeddings = get_embedding_matrix(resume_chunks)

    document_similarity = float(np.dot(jd_document_embedding, resume_document_embedding))

    chunk_similarity = document_similarity

    if jd_chunk_embeddings.size and resume_chunk_embeddings.size:
        similarity_matrix = np.matmul(jd_chunk_embeddings, resume_chunk_embeddings.T)
        best_matches = similarity_matrix.max(axis=1).tolist()
        best_matches.sort(reverse=True)
        strongest_matches = best_matches[: min(3, len(best_matches))]

        if strongest_matches:
            chunk_similarity = sum(strongest_matches) / len(strongest_matches)

    semantic_score = max(0.0, min(1.0, (document_similarity * 0.45) + (chunk_similarity * 0.55))) * 100

    return (
        round(float(semantic_score), 2),
        round(float(document_similarity * 100), 2),
        round(float(chunk_similarity * 100), 2),
    )


def combine_scores(component_scores, missing_required_skills):
    base_weights = {
        "semantic": 0.35,
        "skill": 0.26 if component_scores["skill"] > 0 else 0.0,
        "required": 0.15 if component_scores["required"] > 0 else 0.0,
        "keyword": 0.09,
        "role": 0.07 if component_scores["role"] > 0 else 0.0,
        "experience": 0.08 if component_scores["experience"] > 0 else 0.0,
    }

    total_weight = sum(base_weights.values()) or 1.0
    weighted_score = sum(
        component_scores[key] * base_weights[key] for key in component_scores
    ) / total_weight

    penalty = min(18.0, len(missing_required_skills) * 6.0)
    final_score = max(0.0, weighted_score - penalty)

    return round(float(final_score), 2)


def determine_status(percentage):
    if percentage >= 78:
        return "ACCEPTED"

    if percentage >= 58:
        return "SHORTLISTED"

    return "REJECTED"


def build_empty_match_response():
    return {
        "percentage": 0,
        "status": "REJECTED",
        "matchedSkills": [],
        "missingSkills": [],
        "requiredSkills": [],
        "missingRequiredSkills": [],
        "detectedRole": None,
        "inferredRole": None,
        "scoreBreakdown": {},
    }


@lru_cache(maxsize=2048)
def analyze_match_cached(job_description, resume_text, selected_role=""):
    if not job_description or not resume_text:
        empty_result = build_empty_match_response()
        empty_result["debug"] = {}
        return empty_result

    jd_skill_evidence = extract_skill_evidence(job_description)
    resume_skill_evidence = extract_skill_evidence(resume_text)
    required_skills = extract_required_skills(job_description)
    skill_weights = build_skill_weights(job_description, jd_skill_evidence, required_skills)

    skill_score, matched_skills, missing_skills = compute_weighted_skill_score(
        skill_weights,
        resume_skill_evidence,
    )
    required_skill_score, missing_required_skills = compute_required_skill_score(
        required_skills,
        resume_skill_evidence,
    )
    keyword_score = compute_keyword_overlap(job_description, resume_text)
    experience_score, experience_matched_skills = compute_experience_alignment(
        resume_text,
        skill_weights,
    )
    role_score, detected_role, inferred_role = compute_role_alignment(
        job_description,
        resume_text,
        selected_role,
    )
    semantic_score, document_similarity, chunk_similarity = compute_semantic_score(
        job_description,
        resume_text,
    )

    component_scores = {
        "semantic": semantic_score,
        "skill": skill_score,
        "required": required_skill_score,
        "keyword": keyword_score,
        "role": role_score,
        "experience": experience_score,
    }

    percentage = combine_scores(component_scores, missing_required_skills)
    status = determine_status(percentage)

    sorted_matched_skills = sort_skills(matched_skills, skill_weights)
    sorted_missing_skills = sort_skills(missing_skills, skill_weights)
    sorted_required_skills = sort_skills(required_skills, skill_weights)
    sorted_missing_required_skills = sort_skills(missing_required_skills, skill_weights)

    score_breakdown = {
        "semanticScore": semantic_score,
        "documentSimilarity": document_similarity,
        "chunkSimilarity": chunk_similarity,
        "skillScore": skill_score,
        "requiredSkillScore": required_skill_score,
        "keywordScore": keyword_score,
        "roleAlignmentScore": role_score,
        "experienceScore": experience_score,
    }

    return {
        "percentage": percentage,
        "status": status,
        "matchedSkills": sorted_matched_skills,
        "missingSkills": sorted_missing_skills,
        "requiredSkills": sorted_required_skills,
        "missingRequiredSkills": sorted_missing_required_skills,
        "detectedRole": detected_role,
        "inferredRole": inferred_role,
        "scoreBreakdown": score_breakdown,
        "debug": {
            "selectedRole": normalize_role_name(selected_role) if selected_role else None,
            "jdSkills": sorted(jd_skill_evidence.keys()),
            "resumeSkills": sorted(resume_skill_evidence.keys()),
            "experienceSkills": experience_matched_skills,
        },
    }


def serialize_match_result(result):
    return {
        "percentage": result.get("percentage", 0),
        "status": result.get("status", "REJECTED"),
        "matchedSkills": list(result.get("matchedSkills", [])),
        "missingSkills": list(result.get("missingSkills", [])),
        "requiredSkills": list(result.get("requiredSkills", [])),
        "missingRequiredSkills": list(result.get("missingRequiredSkills", [])),
        "detectedRole": result.get("detectedRole"),
        "inferredRole": result.get("inferredRole"),
        "scoreBreakdown": dict(result.get("scoreBreakdown", {})),
    }


def log_match_debug(candidate_name, applied_at, result):
    if not ATS_VERBOSE_DEBUG:
        return

    debug_data = result.get("debug", {})

    print("\n========== ATS DEBUG ==========")
    print("Candidate Name:", candidate_name)
    print("Applied On:", applied_at)
    print("Selected role:", debug_data.get("selectedRole"))
    print("Detected role:", result.get("detectedRole"))
    print("Inferred role:", result.get("inferredRole"))
    print("JD Skills:", debug_data.get("jdSkills", []))
    print("Resume Skills:", debug_data.get("resumeSkills", []))
    print("Required Skills:", result.get("requiredSkills", []))
    print("Matched Skills:", result.get("matchedSkills", []))
    print("Experience Skills:", debug_data.get("experienceSkills", []))
    print("Missing Skills:", result.get("missingSkills", []))
    print("Missing Required Skills:", result.get("missingRequiredSkills", []))
    print("Breakdown:", result.get("scoreBreakdown", {}))
    print("Final %:", result.get("percentage", 0))
    print("Status:", result.get("status", "REJECTED"))
    print("===============================\n")


@app.route("/match", methods=["POST"])
def match():
    try:
        data = request.get_json() or {}
        job_description = data.get("jobDescription", "")
        resume_text = data.get("resumeText", "")
        selected_role = data.get("selectedRole", "")
        candidate_name = data.get("candidateName", "Unknown")
        applied_at = format_debug_datetime(data.get("appliedAt"))

        result = analyze_match_cached(job_description, resume_text, selected_role)
        log_match_debug(candidate_name, applied_at, result)

        return jsonify(serialize_match_result(result))

    except Exception as error:
        print("ATS ERROR:", str(error))
        return jsonify(build_empty_match_response())


@app.route("/match-batch", methods=["POST"])
def match_batch():
    try:
        data = request.get_json() or {}
        job_description = data.get("jobDescription", "")
        selected_role = data.get("selectedRole", "")
        candidates = data.get("candidates", [])

        if not job_description or not isinstance(candidates, list):
            return jsonify({"results": []})

        results = []

        for candidate in candidates:
            candidate = candidate or {}
            resume_text = candidate.get("resumeText", "")
            result = analyze_match_cached(job_description, resume_text, selected_role)
            log_match_debug(
                candidate.get("candidateName", "Unknown"),
                format_debug_datetime(candidate.get("appliedAt")),
                result,
            )

            serialized_result = serialize_match_result(result)
            serialized_result["candidateId"] = candidate.get("candidateId")
            results.append(serialized_result)

        return jsonify({"results": results})

    except Exception as error:
        print("ATS BATCH ERROR:", str(error))
        return jsonify({"results": []})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
