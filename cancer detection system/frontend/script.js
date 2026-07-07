// API Configuration
const API_BASE = 'http://127.0.0.1:5000/api';
const SERVER_CHECK_INTERVAL = 2000; // 2 seconds

// Global State
let currentResults = null;
let serverConnected = false;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    checkServerStatus();
    setInterval(checkServerStatus, SERVER_CHECK_INTERVAL);
});

// ==========================================
// UI Initialization
// ==========================================

function initializeUI() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Form submissions
    document.getElementById('detectionForm').addEventListener('submit', handleDetectionSubmit);

    // Image preview
    document.getElementById('imageFile').addEventListener('change', handleImagePreview);
}

// ==========================================
// Server Status Check
// ==========================================

async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        setServerStatus(true, `Server: ${data.status}`);
        serverConnected = true;
    } catch (error) {
        setServerStatus(false, 'Server disconnected');
        serverConnected = false;
    }
}

function setServerStatus(connected, message) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    if (connected) {
        indicator.classList.remove('error');
        indicator.classList.add('connected');
        text.textContent = message;
    } else {
        indicator.classList.remove('connected');
        indicator.classList.add('error');
        text.textContent = message;
    }
}

// ==========================================
// Tab Management
// ==========================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Mark button as active
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ==========================================
// Form Handlers
// ==========================================

async function handleDetectionSubmit(e) {
    e.preventDefault();

    if (!serverConnected) {
        showAlert('Server is not connected. Please check your connection.', 'error');
        return;
    }

    const imageFile = document.getElementById('imageFile').files[0];
    if (!imageFile) {
        showAlert('Please select a medical image', 'error');
        return;
    }

    // Validate file size
    if (imageFile.size > 50 * 1024 * 1024) {
        showAlert('File size exceeds 50MB limit', 'error');
        return;
    }

    // Gather patient data
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const reportDetails = document.getElementById('reportDetails').value;
    const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    // Create FormData for image upload
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('report_details', reportDetails);
    formData.append('symptoms', JSON.stringify(symptoms));

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        // Store results
        currentResults = {
            results: data.results,
            patient_info: {
                age: age,
                gender: gender,
                report_details: reportDetails,
                symptoms_count: symptoms.length
            },
            analysis_type: 'cancer_detection'
        };

        displayResults();
        showAlert('🎯 Analysis completed! Check results below.', 'success');
        switchTab('results');

    } catch (error) {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// Image Preview
// ==========================================

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        previewImg.src = event.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ==========================================
// Results Display
// ==========================================

function displayResults() {
    if (!currentResults) return;

    const results = currentResults.results;
    
    // Update risk score
    const riskScore = results.risk_score;
    const riskLevel = results.risk_level;
    const cancerPercentage = (riskScore * 100).toFixed(1);
    
    document.getElementById('riskScoreValue').textContent = cancerPercentage;
    document.getElementById('cancerPercentage').textContent = cancerPercentage + '%';
    document.getElementById('riskScore').textContent = riskScore.toFixed(2);
    document.getElementById('riskLevel').textContent = riskLevel.toUpperCase();
    document.getElementById('confidence').textContent = (results.confidence * 100).toFixed(1);
    
    // Update risk circle styling
    const riskCircle = document.getElementById('riskCircle');
    riskCircle.classList.remove('low', 'moderate', 'high');
    riskCircle.classList.add(riskLevel);

    // Update risk level badge
    const riskLevelElement = document.getElementById('riskLevel');
    riskLevelElement.classList.remove('low', 'moderate', 'high');
    riskLevelElement.classList.add(riskLevel);

    // Update recommendations
    const recommendationsList = document.getElementById('recommendations');
    recommendationsList.innerHTML = '';
    results.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
    });

    // Update patient info
    const patientInfoDiv = document.getElementById('patientInfo');
    patientInfoDiv.innerHTML = '';
    
    if (currentResults.patient_info) {
        const info = currentResults.patient_info;
        
        // Display age and gender
        if (info.age || info.gender) {
            const item = document.createElement('div');
            item.className = 'patient-info-item';
            item.innerHTML = `
                <strong>Patient Details:</strong>
                <span>${info.age ? 'Age: ' + info.age : ''} ${info.gender ? 'Gender: ' + info.gender : ''}</span>
            `;
            patientInfoDiv.appendChild(item);
        }
        
        // Display symptoms
        if (info.symptoms_count > 0) {
            const item = document.createElement('div');
            item.className = 'patient-info-item';
            item.innerHTML = `
                <strong>Symptoms Reported:</strong>
                <span>${info.symptoms_count} symptom(s) reported</span>
            `;
            patientInfoDiv.appendChild(item);
        }
        
        // Display report details if available
        if (info.report_details) {
            const item = document.createElement('div');
            item.className = 'patient-info-item';
            item.innerHTML = `
                <strong>Medical Report:</strong>
                <span>${info.report_details}</span>
            `;
            patientInfoDiv.appendChild(item);
        }
    }

    // Show results container
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('noResults').style.display = 'none';
}

// ==========================================
// Actions
// ==========================================

function downloadResults() {
    if (!currentResults) return;

    const results = currentResults.results;
    const patientInfo = currentResults.patient_info;
    const cancerPercentage = (results.risk_score * 100).toFixed(1);
    const analysisDate = new Date();
    const formattedDate = analysisDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = `
╔════════════════════════════════════════════════════════════════════════════╗
║                 CANCER DETECTION SYSTEM - MEDICAL ANALYSIS REPORT          ║
╚════════════════════════════════════════════════════════════════════════════╝

REPORT GENERATED: ${formattedDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


1. PATIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Patient Age:                    ${patientInfo.age} years
   Gender:                         ${patientInfo.gender === 'M' ? 'Male' : patientInfo.gender === 'F' ? 'Female' : 'Other'}
   Symptoms Reported:              ${patientInfo.symptoms_count || 0} symptom(s)
   
   Medical History / Report:
   ${patientInfo.report_details || 'No additional details provided'}


2. RISK ASSESSMENT RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ESTIMATED CANCER RISK PERCENTAGE:  ${cancerPercentage}%
   ├─ Risk Level:                      ${results.risk_level.toUpperCase()}
   ├─ Confidence Score:                ${(results.confidence * 100).toFixed(1)}%
   └─ Risk Score:                      ${results.risk_score.toFixed(3)} / 1.000


3. RISK INTERPRETATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ${generateRiskInterpretation(cancerPercentage)}


4. CLINICAL RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.recommendations.map((r, i) => `   ${i + 1}. ${r}`).join('\n')}


5. NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   • Schedule an appointment with a qualified oncologist or healthcare specialist
   • Bring this report to your medical consultation
   • Discuss additional diagnostic testing (CT scan, biopsy, etc.)
   • Follow up with regular screening as recommended by your physician
   • Maintain detailed medical records


6. IMPORTANT MEDICAL DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚠️  CRITICAL NOTICE:

   This analysis is generated by an EDUCATIONAL ARTIFICIAL INTELLIGENCE SYSTEM
   and is intended for EDUCATIONAL PURPOSES ONLY. 

   ❌ DO NOT use this report for:
      • Actual medical diagnosis
      • Treatment decisions
      • Self-medication
      • Medical consultation replacement

   ✅ DO:
      • Consult a qualified healthcare professional immediately
      • Use this report as a supplementary reference only
      • Schedule professional medical evaluation
      • Seek second opinions from licensed physicians

   This system is NOT a substitute for professional medical advice, diagnosis,
   or treatment. All medical decisions must be made by qualified healthcare
   professionals based on complete clinical examination and approved diagnostic
   procedures.

   THE CREATORS AND OPERATORS OF THIS SYSTEM ASSUME NO LIABILITY for any
   misuse or reliance on this analysis for medical purposes.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report ID: ${generateReportID()}
System Version: 1.0
Generated by: Cancer Detection System - Educational AI Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cancer_Detection_Report_${new Date().getTime()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    showAlert('Professional report downloaded successfully!', 'success');
}

function generateRiskInterpretation(percentage) {
    const pct = parseFloat(percentage);
    
    if (pct < 20) {
        return `Low Risk (${percentage}%): The analysis suggests a lower probability of cancer.
   However, no screening tool is 100% accurate. Regular check-ups are still recommended.`;
    } else if (pct < 50) {
        return `Moderate Risk (${percentage}%): The analysis suggests a moderate probability of cancer.
   Early consultation with a healthcare professional is advisable.`;
    } else if (pct < 80) {
        return `Elevated Risk (${percentage}%): The analysis suggests an elevated probability of cancer.
   Immediate medical consultation and further diagnostic testing are strongly recommended.`;
    } else {
        return `High Risk (${percentage}%): The analysis suggests a high probability of cancer.
   URGENT: Immediate consultation with an oncologist or healthcare specialist is critical.`;
    }
}

function generateReportID() {
    return 'CDS-' + new Date().getFullYear() + '-' + 
           Math.random().toString(36).substr(2, 9).toUpperCase();
}

function newAnalysis() {
    // Reset form
    document.getElementById('detectionForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    
    // Hide results
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('noResults').style.display = 'block';
    
    // Reset current results
    currentResults = null;
    
    // Switch to detection tab
    switchTab('detection');
}

// ==========================================
// Utility Functions
// ==========================================

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

function capitalizeWords(str) {
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// ==========================================
// Error Handling
// ==========================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showAlert('An unexpected error occurred. Check console for details.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showAlert('An unexpected error occurred.', 'error');
});
