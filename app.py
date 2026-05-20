import os
import re
import pickle
import nltk
from flask import Flask, request, jsonify, render_template, send_from_directory
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

app = Flask(__name__, template_folder='templates', static_folder='static')

# Ensure NLTK Stopwords are downloaded
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Load the saved ML model and vectorizer
MODEL_PATH = 'model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

model = None
vectorizer = None
port_stem = PorterStemmer()
english_stopwords = set(stopwords.words('english'))

def load_models():
    global model, vectorizer
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        print("[-] Models not found. Training model first...")
        # Automatically run train.py to generate models
        import train
        print("[+] Model training finished automatically.")
    
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
    print("[+] Models successfully loaded from disk!")

# Stemming logic (Exactly matches training preprocessing)
def stem_text(text):
    # Keep only alphabetic characters
    cleaned = re.sub('[^a-zA-Z]', ' ', text)
    # Convert to lowercase and tokenize
    words = cleaned.lower().split()
    # Stem words and filter out stopwords
    stemmed = [port_stem.stem(word) for word in words if word not in english_stopwords]
    return ' '.join(stemmed)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        title = data.get('title', '').strip()
        author = data.get('author', '').strip()
        text = data.get('text', '').strip()
        
        if not title and not author:
            return jsonify({'error': 'Please provide at least a news Title or Author.'}), 400

        # Combine title and author as done in model training
        # Original notebook: news_dataset['content'] = news_dataset['author'] + news_dataset['title']
        combined_content = author + title
        
        # Stem the input text
        stemmed_content = stem_text(combined_content)
        
        # Check if stemmed content is empty
        if not stemmed_content.strip():
            return jsonify({
                'prediction': 1,
                'label': 'Fake',
                'confidence': 50.00,
                'message': 'Insufficient unique content. Treated as unverified (Fake).',
                'stats': {
                    'char_count': len(text),
                    'word_count': len(text.split()),
                    'reading_time': round(len(text.split()) / 200, 1),
                },
                'keywords': []
            })
            
        # Vectorize
        vectorized_input = vectorizer.transform([stemmed_content])
        
        # Predict Class & Probability
        prediction = int(model.predict(vectorized_input)[0])
        probabilities = model.predict_proba(vectorized_input)[0]
        
        # Calculate confidence score
        # Class 0: Real News, Class 1: Fake News
        confidence = float(probabilities[0] if prediction == 0 else probabilities[1]) * 100
        
        # Analyze article text stats
        word_count = len(text.split()) if text else 0
        char_count = len(text) if text else 0
        reading_time = round(word_count / 200, 1) # Avg reading speed ~200 wpm
        
        # Extract keywords analyzed by TF-IDF (features present in this specific input)
        feature_names = vectorizer.get_feature_names_out()
        coo = vectorized_input.tocoo()
        word_weights = []
        for col, val in zip(coo.col, coo.data):
            word_weights.append((feature_names[col], float(val)))
        
        # Sort keywords by TF-IDF weight descending
        word_weights.sort(key=lambda x: x[1], reverse=True)
        top_keywords = [item[0] for item in word_weights[:6]]
        
        return jsonify({
            'prediction': prediction,
            'label': 'Real' if prediction == 0 else 'Fake',
            'confidence': round(confidence, 2),
            'stats': {
                'word_count': word_count,
                'char_count': char_count,
                'reading_time': reading_time if reading_time > 0 else 0.1
            },
            'keywords': top_keywords
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize models
    load_models()
    # Start flask server
    app.run(debug=True, port=5000)
