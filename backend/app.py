from flask import Flask, request, jsonify 
from flask_cors import CORS
import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import re
import string

# Try to import NLTK, but have a fallback if it fails
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    
    # Try to download NLTK resources silently - use try/except to handle errors
    try:
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('punkt', quiet=True)
        NLTK_AVAILABLE = True
    except Exception as e:
        print(f"Warning: NLTK download failed: {e}")
        NLTK_AVAILABLE = False
except ImportError:
    print("Warning: NLTK not available. Using basic text preprocessing.")
    NLTK_AVAILABLE = False

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"message": "Server is running!"})

# Text cleaning function
def preprocess_text(text):
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    
    if NLTK_AVAILABLE:
        try:
            # Tokenize and remove stopwords
            stop_words = set(stopwords.words('english'))
            
            # Initialize lemmatizer
            lemmatizer = WordNetLemmatizer()
            
            # Tokenize, remove stopwords, and lemmatize
            tokens = nltk.word_tokenize(text)
            filtered_tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words and len(word) > 2]
            
            # Join tokens back into a string
            preprocessed_text = ' '.join(filtered_tokens)
            
            # Remove extra spaces
            preprocessed_text = re.sub(r'\s+', ' ', preprocessed_text).strip()
            
            return preprocessed_text
        except Exception as e:
            print(f"Warning: NLTK processing failed: {e}, falling back to basic preprocessing")
            # Fall back to basic preprocessing
    
    # Basic preprocessing (fallback)
    # Remove non-alphabet characters and extra spaces
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Extract text from PDF
def extract_text_from_pdf(resume_file):
    try:
        text = ""
        with fitz.open(stream=resume_file.read(), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
        if not text.strip():
            print("Warning: Extracted empty text from PDF")
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

# Similarity score using cosine similarity
def calculate_similarity(text1, text2):
    text1 = preprocess_text(text1)
    text2 = preprocess_text(text2)
    vectorizer = TfidfVectorizer(stop_words='english')
    vectors = vectorizer.fit_transform([text1, text2])
    vec1, vec2 = vectors.toarray()
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        cosine_sim = 0.0
    else:
        cosine_sim = np.dot(vec1, vec2) / (norm1 * norm2)
    return round(cosine_sim * 100, 2)

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    resume = request.files.get('resume')
    # Check for both parameter names to be compatible with frontend
    job_desc = request.form.get('jobDescription') or request.form.get('jobDesc')

    if not resume:
        return jsonify({"error": "Please upload a resume."}), 400
    if not job_desc:
        return jsonify({"error": "Please paste the job description."}), 400

    try:
        resume_text = extract_text_from_pdf(resume)
        similarity_score = calculate_similarity(resume_text, job_desc)

        return jsonify({
            "message": "Resume and Job Description received successfully!",
            "resume_filename": resume.filename,
            "resume_text_length": len(resume_text),
            "job_description_length": len(job_desc),
            "similarity_score": f"{similarity_score}%"
        })
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)

