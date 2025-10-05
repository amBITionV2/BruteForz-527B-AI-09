# BruteForz-527B-AI-09
## ⚙️ Setup and Installation  

### Frontend (React + Vite + TailwindCSS)

```bash
# Navigate to frontend directory
cd EchoMind/Frontend

# Install dependencies
npm i install
npm install tailwindcss @tailwindcss/vite
npm i axios react-router-dom framer-motion react-feather lucide-react date-fns react-chartjs-2
npm install i18next react-i18next

# Start development server
npm run dev
```

---

### Backend (Flask)

```bash
# Navigate to backend directory
cd ../Backend

# Create and activate virtual environment

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Flask server
flask run
# OR
python app.py

# To expose publicly (optional)
flask run --host=0.0.0.0 --port=5000
```

> Ensure environment variable is set:  
> - macOS/Linux: `export FLASK_APP=app.py`  
> - Windows: `set FLASK_APP=app.py`  

---

### 🔄 Running Both Servers
Open two terminals:  
- **Terminal 1:** Run Flask backend  
- **Terminal 2:** Run React frontend

---

## 👥 Team Details  
- **Team Name:** BruteForz  
- **Team Members:** Shashank MS
- **Team Members:** Utkarsh Saraswath
- **Team Members:** Subhash Srinivas Reddy
- **Team Members:** AP Saroon  
- **Institute:** Bangalore Institute of Technology  

---