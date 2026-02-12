from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

model = SentenceTransformer("all-MiniLM-L6-v2")

@app.route("/match", methods=["POST"])
def match():
    data = request.json
    jd = data["jobDescription"]
    resume = data["resumeText"]

    jd_vec = model.encode([jd])
    resume_vec = model.encode([resume])

    score = cosine_similarity(jd_vec, resume_vec)[0][0]
    percentage = round(score * 100, 2)

    return jsonify({ "percentage": percentage })

if __name__ == "__main__":
    app.run(port=8000)
