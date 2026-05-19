# Fake-News-Predictor

## Overview

Fake-News-Predictor is a machine learning project that detects whether news articles are real or fake. It uses a dataset of news articles with author, title, and text fields and trains a logistic regression model on text features.

## Project structure

- `Fake_News.ipynb`: Jupyter notebook containing the data loading, preprocessing, model training, evaluation, and prediction workflow.
- `train.csv`: Dataset used for training and testing the fake news classifier.

## Dataset

The dataset includes the following fields:

- `id`: unique identifier for the news article
- `title`: title of the article
- `author`: author of the article
- `text`: main text content of the article
- `label`: target label where `0` indicates real news and `1` indicates fake news

## Key steps in the notebook

1. Load the dataset into a pandas DataFrame.
2. Fill missing values and concatenate `author` and `title` into a `content` field.
3. Clean text using regular expressions, lowercase conversion, tokenization, stopword removal, and stemming.
4. Convert text to numerical features with `TfidfVectorizer`.
5. Split data into training and test sets.
6. Train a `LogisticRegression` model.
7. Evaluate accuracy on training and test sets.
8. Test the predictive system using a sample input from the test set.

## Dependencies

The notebook uses the following Python libraries:

- `numpy`
- `pandas`
- `nltk`
- `scikit-learn`

## Getting started

1. Install Python and create a virtual environment if desired.
2. Install the required packages:

```bash
pip install numpy pandas nltk scikit-learn
```

3. Download the `train.csv` file into the project folder if it is not already present.
4. Open `Fake_News.ipynb` in Jupyter Notebook or JupyterLab.
5. Run the notebook cells in order.

## Notes

- The notebook downloads the NLTK stopwords dataset with `nltk.download('stopwords')`.
- The final interactive prediction step selects a sample by index from the test split.
- The model is a prototype and can be improved by using more features, deeper preprocessing, or a different classification algorithm.

