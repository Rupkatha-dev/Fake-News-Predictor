import os
import re
import time
import pickle
import numpy as np
import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Step 1: Ensure NLTK Stopwords are downloaded
print("=" * 60)
print("  FAKE NEWS PREDICTOR: MODEL TRAINING UTILITY  ")
print("=" * 60)

print("\n[1/6] Setting up NLTK stopwords dataset...")
try:
    nltk.data.find('corpora/stopwords')
    print("      Stopwords are already downloaded.")
except LookupError:
    print("      Downloading NLTK stopwords...")
    nltk.download('stopwords')
    print("      Download completed successfully.")

# Step 2: Load the dataset
print("\n[2/6] Loading 'train.csv' dataset...")
start_time = time.time()
if not os.path.exists('train.csv'):
    raise FileNotFoundError("Error: 'train.csv' not found. Please ensure it is in the project directory.")

df = pd.read_csv('train.csv')
load_time = time.time() - start_time
print(f"      Loaded {df.shape[0]} articles with {df.shape[1]} columns in {load_time:.2f} seconds.")

# Step 3: Handle nulls and concatenate author and title
print("      Preprocessing and cleaning missing values...")
df = df.fillna('')
df['content'] = df['author'] + df['title']

# Step 4: Stemming process
print("\n[3/6] Applying stemming & stopword filtering...")
print("      (This might take around 20-30 seconds depending on CPU power...)")
port_stem = PorterStemmer()
english_stopwords = set(stopwords.words('english'))

def stem_text(text):
    # Keep only alphabetic characters
    cleaned = re.sub('[^a-zA-Z]', ' ', text)
    # Convert to lowercase and tokenize
    words = cleaned.lower().split()
    # Stem words and filter out stopwords
    stemmed = [port_stem.stem(word) for word in words if word not in english_stopwords]
    return ' '.join(stemmed)

start_time = time.time()
# Apply stemming to the 'content' column
df['content'] = df['content'].apply(stem_text)
stemming_time = time.time() - start_time
print(f"      Stemming complete! Processed {len(df)} rows in {stemming_time:.2f} seconds.")

# Step 5: Convert text features to numeric vectors
print("\n[4/6] Transforming text using TfidfVectorizer...")
x = df['content'].values
y = df['label'].values

vectorizer = TfidfVectorizer()
x_numeric = vectorizer.fit_transform(x)
print(f"      Vocabulary size: {x_numeric.shape[1]} unique words.")

# Step 6: Train Logistic Regression model
print("\n[5/6] Training Logistic Regression model...")
x_train, x_test, y_train, y_test = train_test_split(
    x_numeric, y, test_size=0.2, stratify=y, random_state=2
)

model = LogisticRegression(max_iter=1000)
model.fit(x_train, y_train)

# Evaluate model
y_train_pred = model.predict(x_train)
train_accuracy = accuracy_score(y_train, y_train_pred)

y_test_pred = model.predict(x_test)
test_accuracy = accuracy_score(y_test, y_test_pred)

print(f"      Training Set Accuracy: {train_accuracy * 100:.2f}%")
print(f"      Testing Set Accuracy:  {test_accuracy * 100:.2f}%")

# Step 7: Serialize and save model + vectorizer
print("\n[6/6] Saving models to disk...")
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("      Saved 'model.pkl' successfully.")

with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)
print("      Saved 'vectorizer.pkl' successfully.")

print("\n" + "=" * 60)
print("  MODEL TRAINING SUCCESSFUL! ALL ASSETS READY  ")
print("=" * 60)
