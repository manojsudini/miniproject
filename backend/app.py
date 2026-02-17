from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)

# ⭐ Better AI model (upgrade from MiniLM)
model = SentenceTransformer("all-mpnet-base-v2")


# ---------- TEXT CLEANING ----------
def clean_text(text):
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9., ]", "", text)
    return text.strip()


# ---------- KEYWORD SCORE ----------
def keyword_score(jd, resume):
    jd_words = set(jd.split())
    resume_words = set(resume.split())

    if not jd_words:
        return 0

    overlap = jd_words & resume_words
    return len(overlap) / len(jd_words)


# ---------- SKILL BOOST ----------
important_skills = [
    "react", "node", "python", "docker",
    "aws", "mongodb", "selenium",
    "testing", "api", "kubernetes"
]


def skill_boost(resume):
    boost = 0
    for skill in important_skills:
        if skill in resume:
            boost += 0.02
    return boost


# ---------- MATCH ROUTE ----------
@app.route("/match", methods=["POST"])
def match_resume():
    try:
        data = request.get_json()

        # Accept both frontend field names
        resume_text = data.get("resumeText") or data.get("resume")
        job_text = data.get("jobDescription") or data.get("job")

        if not resume_text or not job_text:
            return jsonify({"error": "Missing resume or job text"}), 400

        # Clean text
        resume_text = clean_text(resume_text)
        job_text = clean_text(job_text)

        # Semantic similarity
        resume_vector = model.encode([resume_text])
        job_vector = model.encode([job_text])

        semantic_score = cosine_similarity(
            resume_vector,
            job_vector
        )[0][0]

        # Keyword matching
        keyword_match = keyword_score(job_text, resume_text)

        # Final ATS score
        final_score = (
            0.7 * semantic_score +
            0.3 * keyword_match +
            skill_boost(resume_text)
        )

        final_score = min(final_score, 1.0)

        match_percentage = round(float(final_score) * 100, 2)

        return jsonify({
            "percentage": match_percentage
        })

    except Exception as e:
        print("AI ERROR:", e)
        return jsonify({"percentage": 0})


if __name__ == "__main__":
    print("ATS AI Server Running...")
    app.run(host="0.0.0.0", port=8000, debug=True)