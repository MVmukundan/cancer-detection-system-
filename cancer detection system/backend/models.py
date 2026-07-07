import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
import pickle
import os

class CancerDetectionModel:
    """
    Machine Learning model for cancer risk detection.
    Uses SVM for binary classification.
    """
    
    def __init__(self, model_path=None):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.initialize_default_model()
    
    def initialize_default_model(self):
        """Initialize a default trained model with sample data."""
        # Sample training data (30 features - typical for cancer datasets)
        np.random.seed(42)
        n_samples = 300
        n_features = 30
        
        # Generate synthetic training data
        X_train = np.random.randn(n_samples, n_features)
        # Create labels with some correlation to features
        y_train = (np.sum(X_train[:, :5], axis=1) > 0).astype(int)
        
        # Train the model
        self.scaler.fit(X_train)
        X_scaled = self.scaler.transform(X_train)
        
        self.model = SVC(kernel='rbf', probability=True, random_state=42)
        self.model.fit(X_scaled, y_train)
        self.is_trained = True
    
    def predict(self, features):
        """
        Predict cancer risk for given features.
        
        Args:
            features: Array of clinical features
            
        Returns:
            dict: Prediction results including risk score and confidence
        """
        if not self.is_trained or self.model is None:
            return {
                'error': 'Model not trained',
                'risk_score': 0.5,
                'confidence': 0.0
            }
        
        try:
            # Ensure features is numpy array
            features = np.array(features).reshape(1, -1)
            
            # Pad or trim to expected feature count
            if features.shape[1] < 30:
                padding = np.zeros((1, 30 - features.shape[1]))
                features = np.hstack([features, padding])
            elif features.shape[1] > 30:
                features = features[:, :30]
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Make prediction
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get confidence (probability of predicted class)
            confidence = max(probabilities)
            risk_score = probabilities[1] if len(probabilities) > 1 else 0.5
            
            # Determine risk level
            if risk_score < 0.3:
                risk_level = "low"
            elif risk_score < 0.7:
                risk_level = "moderate"
            else:
                risk_level = "high"
            
            return {
                'risk_score': float(risk_score),
                'risk_level': risk_level,
                'confidence': float(confidence),
                'prediction': int(prediction)
            }
        except Exception as e:
            return {
                'error': str(e),
                'risk_score': 0.5,
                'confidence': 0.0
            }
    
    def save_model(self, path):
        """Save model to file."""
        with open(path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler
            }, f)
    
    def load_model(self, path):
        """Load model from file."""
        try:
            with open(path, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.scaler = data['scaler']
                self.is_trained = True
        except Exception as e:
            print(f"Error loading model: {e}")
            self.initialize_default_model()

def create_sample_features(age, gender, symptoms):
    """
    Create feature vector from user input.
    
    Args:
        age: Patient age
        gender: 0 for female, 1 for male
        symptoms: List of symptom presence (0 or 1)
    
    Returns:
        list: Feature vector for model
    """
    features = [
        age / 100.0,  # Normalized age
        gender,
        len(symptoms) / 10.0,  # Symptom count ratio
    ]
    
    # Pad to 30 features with normalized random values
    while len(features) < 30:
        features.append(np.random.random() * 0.5)
    
    return features[:30]
