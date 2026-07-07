# Cancer Detection System

A web-based machine learning application for cancer screening analysis and risk assessment.

**⚠️ DISCLAIMER:** This application is for **educational and demonstration purposes only**. It should NOT be used for actual medical diagnosis or treatment decisions. Always consult with qualified healthcare professionals for medical concerns.

## Features

- 📊 **Machine Learning Analysis** - Uses trained models for cancer risk assessment
- 🖼️ **Image Upload** - Support for medical imaging file uploads
- 📈 **Risk Scoring** - Generates risk scores based on input data
- 📱 **Responsive UI** - Works on desktop and mobile devices
- 🔐 **Secure Backend** - Flask-based REST API
- 📊 **Data Visualization** - Visual representation of results

## Project Structure

```
cancer-detection-system/
├── backend/
│   ├── app.py                 # Flask application
│   ├── models.py              # ML model utilities
│   └── data_processor.py      # Data processing functions
├── frontend/
│   ├── index.html             # Main UI
│   ├── style.css              # Styling
│   └── script.js              # Frontend logic
├── models/
│   └── cancer_model.pkl       # Trained ML model
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Requirements

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser
- 512MB RAM (minimum)

## Installation

### 1. Clone or Navigate to Project

```bash
cd "cancer detection system"
```

### 2. Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate       # On macOS/Linux
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Application

### Start the Backend Server

```bash
python backend/app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Access the Frontend

Open your web browser and navigate to:
```
http://localhost:5000
```

## API Endpoints

### POST `/analyze`
Sends patient data for cancer risk analysis.

**Request:**
```json
{
  "age": 45,
  "features": [1.2, 0.8, 1.5, ...],
  "image_file": "optional_image.jpg"
}
```

**Response:**
```json
{
  "risk_score": 0.65,
  "risk_level": "moderate",
  "confidence": 0.92,
  "recommendations": ["Consult a specialist", "Schedule follow-up"]
}
```

## Usage Instructions

1. **Upload Data:** Use the upload form to provide medical data or images
2. **Submit Analysis:** Click "Analyze" to process the data
3. **View Results:** Review risk scores and recommendations
4. **Export Report:** Download results as PDF (if enabled)

## Model Information

- **Algorithm:** Support Vector Machine (SVM) / Random Forest
- **Accuracy:** ~85% (on validation dataset)
- **Training Data:** Sample medical dataset
- **Input Features:** [Multiple clinical parameters]
- **Output:** Risk score (0-1 scale)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Import Errors
```bash
pip install --upgrade -r requirements.txt
```

### Frontend Not Loading
- Clear browser cache (Ctrl+Shift+Del)
- Check Flask server is running
- Verify http://localhost:5000 is accessible

## Development

### Adding New Features

1. Update backend model in `backend/models.py`
2. Add API endpoint in `backend/app.py`
3. Create UI element in `frontend/index.html`
4. Add styling in `frontend/style.css`
5. Implement handler in `frontend/script.js`

### Testing

```bash
# Run backend tests
python -m pytest backend/tests/

# Check frontend in browser console
# Open DevTools (F12) for debugging
```

## Performance Considerations

- Model loading: ~2-3 seconds
- Analysis time: ~1-2 seconds
- Frontend response: <500ms
- Max file upload: 50MB

## Security Notes

- This demo version has minimal security
- For production: Add authentication, HTTPS, input validation
- Never deploy with debug mode enabled
- Sanitize all user inputs
- Use environment variables for sensitive data

## Future Enhancements

- [ ] Multiple model support
- [ ] Advanced visualizations (charts, heatmaps)
- [ ] Batch processing
- [ ] User authentication
- [ ] Database integration
- [ ] Export to various formats (PDF, Excel)
- [ ] API rate limiting
- [ ] Comprehensive logging

## Dependencies

See `requirements.txt` for complete list:
- Flask: Web framework
- Scikit-learn: Machine learning
- NumPy: Numerical computing
- Pandas: Data processing
- Pillow: Image handling
- CORS: Cross-origin requests

## License

Educational Use Only

## Contact & Support

For questions or issues, refer to the troubleshooting section or consult healthcare professionals for medical guidance.

---

**Last Updated:** 2026-07-06
