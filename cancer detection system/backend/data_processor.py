import numpy as np
from PIL import Image
import io
import base64

class DataProcessor:
    """Handles data processing and validation."""
    
    @staticmethod
    def validate_input(data):
        """Validate user input data."""
        errors = []
        
        if 'age' not in data:
            errors.append("Age is required")
        elif not isinstance(data['age'], (int, float)) or data['age'] < 0 or data['age'] > 150:
            errors.append("Age must be between 0 and 150")
        
        if 'gender' not in data:
            errors.append("Gender is required")
        elif data['gender'] not in ['M', 'F', 'Other']:
            errors.append("Gender must be M, F, or Other")
        
        return errors
    
    @staticmethod
    def process_image(image_data):
        """
        Process uploaded image file.
        
        Args:
            image_data: Image file or base64 string
            
        Returns:
            dict: Processed image data or error
        """
        try:
            if isinstance(image_data, str):
                # Handle base64 encoded image
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                image = Image.open(image_data)
            
            # Resize to standard size
            image = image.resize((224, 224))
            
            # Convert to numpy array
            image_array = np.array(image) / 255.0
            
            # Flatten for feature extraction
            features = image_array.flatten()
            
            return {
                'success': True,
                'features': features.tolist(),
                'shape': image_array.shape
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def combine_features(clinical_data, image_features=None):
        """
        Combine clinical data and image features.
        
        Args:
            clinical_data: Clinical parameters
            image_features: Optional image features
            
        Returns:
            list: Combined feature vector
        """
        features = clinical_data.copy()
        
        if image_features:
            # Downsample image features for dimensionality
            if len(image_features) > 10:
                image_features = image_features[::len(image_features)//10][:10]
            features.extend(image_features)
        
        # Ensure consistent feature count
        while len(features) < 30:
            features.append(0)
        
        return features[:30]
    
    @staticmethod
    def format_results(prediction):
        """Format model prediction results."""
        return {
            'risk_score': round(prediction.get('risk_score', 0.5), 3),
            'risk_level': prediction.get('risk_level', 'unknown'),
            'confidence': round(prediction.get('confidence', 0), 3),
            'recommendations': DataProcessor.get_recommendations(
                prediction.get('risk_score', 0.5)
            )
        }
    
    @staticmethod
    def get_recommendations(risk_score):
        """Generate recommendations based on risk score."""
        recommendations = []
        
        if risk_score < 0.3:
            recommendations = [
                "Continue regular health checkups",
                "Maintain healthy lifestyle",
                "Annual screening recommended"
            ]
        elif risk_score < 0.7:
            recommendations = [
                "Consult with a healthcare specialist",
                "Consider additional screening tests",
                "Monitor symptoms closely",
                "Schedule follow-up consultation"
            ]
        else:
            recommendations = [
                "URGENT: Consult healthcare professional immediately",
                "Schedule specialist appointment",
                "Consider advanced diagnostic tests",
                "Inform primary care physician",
                "Do not delay medical consultation"
            ]
        
        return recommendations
