from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)

# Allow React frontend
CORS(app)

print("Loading ATS AI model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded successfully")


# ================================
# SKILL DATABASE
# ================================

SKILLS_DB = [
    "python","java","c","c++","javascript","react","node","nodejs",
    "sql","mongodb","mysql","postgresql",
    "html","css","bootstrap","tailwind",
    "selenium","pytest","testing","automation",
    "docker","kubernetes","aws","azure",
    "api","rest","restapi","git","github",
    "machine learning","data analysis","pandas","numpy",

    # security skills
    "investigation","safety compliance","criminal justice",
    "cctv","surveillance","security monitoring",
    "incident reporting","access control",
    "risk assessment","emergency response","patrolling"
]


# ================================
# CLEAN TEXT FUNCTION
# ================================

def clean_text(text):

    text = text.lower()

    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    text = re.sub(r'\s+', ' ', text)

    return text.strip()


# ================================
# EXTRACT SKILLS
# ================================

def extract_skills(text):

    text = text.lower()

    found = []

    for skill in SKILLS_DB:

        if re.search(r"\b" + re.escape(skill) + r"\b", text):

            found.append(skill)

    return found


# ================================
# EXTRACT CGPA FROM RESUME
# ================================

def extract_cgpa(text):

    text = text.lower()

    match = re.search(r'(cgpa|gpa)\s*[:\-]?\s*(\d+(\.\d+)?)', text)

    if match:
        return float(match.group(2))

    return None


# ================================
# ATS MATCH API
# ================================

@app.route("/match", methods=["POST"])
def match():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "percentage": 0,
                "missingSkills": [],
                "matchedSkills": []
            })

        job_description = data.get("jobDescription", "")
        resume_text = data.get("resumeText", "")

        if not job_description or not resume_text:

            return jsonify({
                "percentage": 0,
                "missingSkills": [],
                "matchedSkills": []
            })

        # Clean text
        clean_jd = clean_text(job_description)
        clean_resume = clean_text(resume_text)

        print("Clean JD:", clean_jd[:120])
        print("Clean Resume:", clean_resume[:120])

        # ================================
        # AI EMBEDDINGS
        # ================================

        embeddings = model.encode([clean_jd, clean_resume])

        jd_vec = embeddings[0].reshape(1, -1)
        resume_vec = embeddings[1].reshape(1, -1)

        score = cosine_similarity(jd_vec, resume_vec)[0][0]

        percentage = float(round(score * 100, 2))

        # ================================
        # SKILL MATCHING
        # ================================

        jd_skills = extract_skills(job_description)
        resume_skills = extract_skills(resume_text)

        matched_skills = list(set(jd_skills) & set(resume_skills))
        missing_skills = list(set(jd_skills) - set(resume_skills))

        # ================================
        # CGPA FILTER
        # ================================

        resume_cgpa = extract_cgpa(resume_text)

        REQUIRED_CGPA = 7

        if resume_cgpa is not None:

            print("Candidate CGPA:", resume_cgpa)

            if resume_cgpa < REQUIRED_CGPA:

                print("Candidate rejected due to low CGPA")

                percentage = 0

        # ================================
        # DEBUG LOGS
        # ================================

        print("Similarity Score:", score)
        print("Final Percentage:", percentage)

        print("JD Skills:", jd_skills)
        print("Resume Skills:", resume_skills)

        print("Matched Skills:", matched_skills)
        print("Missing Skills:", missing_skills)

        return jsonify({
            "percentage": percentage,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills
        })

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "percentage": 0,
            "matchedSkills": [],
            "missingSkills": []
        })


# ================================
# RUN SERVER
# ================================

if __name__ == "__main__":

    app.run(port=8000, debug=True)