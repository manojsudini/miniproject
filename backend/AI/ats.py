from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# ⭐ Allow React frontend requests
CORS(app)

# ⭐ Load AI model once
model = SentenceTransformer("all-MiniLM-L6-v2")


@app.route("/match", methods=["POST"])
def match():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"percentage": 0})

        job_description = data.get("jobDescription", "")
        resume_text = data.get("resumeText", "")

        print("JD:", job_description)
        print("Resume:", resume_text[:100])  # only preview text

        if not job_description or not resume_text:
            return jsonify({"percentage": 0})

        jd_vec = model.encode([job_description])
        resume_vec = model.encode([resume_text])

        score = cosine_similarity(jd_vec, resume_vec)[0][0]

        # ⭐ IMPORTANT FIX → numpy.float32 → python float
        percentage = float(round(score * 100, 2))

        return jsonify({"percentage": percentage})

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"percentage": 0})


if __name__ == "__main__":
    app.run(port=8000, debug=True)