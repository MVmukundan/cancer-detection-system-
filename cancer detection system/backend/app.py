from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
from werkzeug.utils import secure_filename

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import CancerDetectionModel, create_sample_features
from data_processor import DataProcessor

# Initialize Flask app
app = Flask(__name__, 
            template_folder='../frontend',
            static_folder='../frontend',
            static_url_path='')

CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize ML model
cancer_model = CancerDetectionModel()

def allowed_file(filename):
    """Check if file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Serve main page."""
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_trained': cancer_model.is_trained,
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze patient data for cancer risk.
    
    Expected JSON:
    {
        'age': int,
        'gender': 'M'/'F'/'Other',
        'symptoms': list of symptom indices,
        'clinical_params': list of clinical measurements,
        'image': optional base64 encoded image
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        errors = DataProcessor.validate_input(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Extract and process features
        age = data.get('age')
        gender = 1 if data.get('gender') == 'M' else 0
        symptoms = data.get('symptoms', [])
        clinical_params = data.get('clinical_params', [])
        
        # Create feature vector
        features = create_sample_features(age, gender, symptoms)
        
        # Add clinical parameters if provided
        if clinical_params:
            features = DataProcessor.combine_features(features, clinical_params[:10])
        
        # Get prediction
        prediction = cancer_model.predict(features)
        
        # Format results
        results = DataProcessor.format_results(prediction)
        
        return jsonify({
            'success': True,
            'results': results,
            'patient_info': {
                'age': age,
                'gender': data.get('gender')
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze patient image for cancer detection."""
    try:
        import json
        
        # Check if image is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(image_file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Process image
        result = DataProcessor.process_image(image_file)
        
        if not result.get('success'):
            return jsonify({'error': result.get('error')}), 400
        
        # Get prediction
        image_features = result.get('features', [])
        
        # Get additional data from form
        try:
            age = int(request.form.get('age', 50))
        except (ValueError, TypeError):
            age = 50
            
        gender = request.form.get('gender', 'M')
        report_details = request.form.get('report_details', '')
        
        # Parse symptoms (comes as JSON string from frontend)
        symptoms = []
        try:
            symptoms_str = request.form.get('symptoms', '[]')
            symptoms = json.loads(symptoms_str) if symptoms_str else []
        except (json.JSONDecodeError, TypeError):
            symptoms = []
        
        # Create combined features
        base_features = create_sample_features(age, 1 if gender == 'M' else 0, symptoms)
        final_features = DataProcessor.combine_features(base_features, image_features[:10])
        
        # Get prediction
        prediction = cancer_model.predict(final_features)
        results = DataProcessor.format_results(prediction)
        
        return jsonify({
            'success': True,
            'results': results,
            'patient_info': {
                'age': age,
                'gender': gender,
                'report_details': report_details,
                'symptoms_count': len(symptoms)
            },
            'image_info': {
                'filename': secure_filename(image_file.filename)
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available models and their info."""
    return jsonify({
        'models': [
            {
                'name': 'Primary SVM Model',
                'algorithm': 'Support Vector Machine',
                'accuracy': '85%',
                'features': 30,
                'trained': cancer_model.is_trained
            }
        ]
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Cancer Detection System Backend...")
    print("Server running on http://127.0.0.1:5000")
    print("⚠️  DISCLAIMER: Educational use only. Not for medical diagnosis.")
    app.run(debug=True, host='127.0.0.1', port=5000)
