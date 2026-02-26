from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Load AI model (pre-trained)
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/match', methods=['POST'])
def match_resume():
    data = request.get_json()

    resume_text = data.get("resume")
    job_text = data.get("job")

    # Validation
    if not resume_text or not job_text:
        return jsonify({"error": "Missing resume or job text"}), 400

    # Convert text to vectors
    resume_vector = model.encode(resume_text)
    job_vector = model.encode(job_text)

    # Cosine similarity
    score = cosine_similarity(
        [resume_vector],
        [job_vector]
    )[0][0]

    # IMPORTANT FIX: convert numpy float → python float
    match_percentage = round(float(score) * 100, 2)

    return jsonify({
        "match_percentage": match_percentage
    })


if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(host="0.0.0.0", port=5000, debug=True)
