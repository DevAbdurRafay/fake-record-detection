<h1 align="center">Fake Record Detection System</h1>

<p>
A <strong>Python-based Hybrid Anomaly Detection System</strong> that combines <strong>Machine Learning</strong> and <strong>Rule-Based Analysis</strong> to identify suspicious, fraudulent, and automated internship applications. The platform provides real-time analytics, intelligent applicant screening, and interactive visualizations for detecting fake records.
</p>

<h2>🚀 Features</h2>

<ul>
  <li>AI-Powered Fake Record Detection</li>
  <li>Isolation Forest Based Outlier Detection</li>
  <li>K-Means Behavioral Clustering</li>
  <li>Rule-Based Fraud & Bot Detection Engine</li>
  <li>Real-Time CSV File Analysis</li>
  <li>Interactive Analytics Dashboard</li>
  <li>Advanced Search & Filtering System</li>
  <li>Dynamic Charts & Data Visualizations</li>
</ul>

---

<h2>🛠️ Tech Stack</h2>

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit Learn" />
  <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</p>

---

<h2>🏗️ Architecture</h2>

<ul>
  <li><strong>API Layer:</strong> FastAPI REST APIs</li>
  <li><strong>ML Layer:</strong> Isolation Forest & K-Means Models</li>
  <li><strong>Processing Layer:</strong> Data Preprocessing Pipeline</li>
  <li><strong>Detection Layer:</strong> Rule-Based Alert Engine</li>
  <li><strong>Visualization Layer:</strong> Interactive Dashboard & Charts</li>
</ul>

---

<h2>⚙️ Setup & Installation</h2>

<pre><code>
git clone https://github.com/DevAbdurRafay/fake-record-detection.git
cd fake-record-detection
pip install -r requirements.txt
python backend/train.py
uvicorn backend.main:app --reload
</code></pre>

---

<h2>📂 Project Structure</h2>

<ul>
  <li><code>backend/main.py</code> - FastAPI server and API endpoints</li>
  <li><code>backend/train.py</code> - Machine learning training pipeline</li>
  <li><code>backend/Preprocessor.py</code> - Data preprocessing and feature engineering</li>
  <li><code>backend/alerts.py</code> - Rule-based anomaly detection engine</li>
  <li><code>templates/</code> - Frontend pages and dashboard templates</li>
  <li><code>static/</code> - CSS, JavaScript, charts, and UI assets</li>
  <li><code>backend/models/</code> - Trained model files (.pkl)</li>
</ul>

---

<p align="center">
  <em>Developed as an AI-powered anomaly detection solution for identifying fake, suspicious, and automated application records using Machine Learning and behavioral analytics.</em>
</p>
