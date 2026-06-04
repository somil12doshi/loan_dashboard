# Loan Tracking Dashboard

A premium, responsive, and animated financial dashboard built to track interest-free JAIN Trust loans and HDFC student loan tranches, repayments, interest calculations, and remaining liabilities. Connected to a live Firebase Firestore database backend and hosted on GitHub Pages.

---

## 🛠 Tech Stack

- **Core**: React 19 & JavaScript (ES6+)
- **Build Tool**: Vite (v8)
- **Styling**: Tailwind CSS (v4) & Custom CSS (featuring glassmorphism, glowing accents, and harmonized dark mode gradients)
- **Animations**: Framer Motion (for smooth transitions, hover micro-animations, and loaders)
- **Data Visualizations**: Recharts (for original principal distribution and outstanding remaining liability pie charts)
- **Backend Database**: Firebase Firestore (for persistent cloud storage)
- **Hosting & Deployment**: GitHub Pages (`gh-pages` package)

---

## 📂 Project Architecture

```text
├── .env                  # Private Firebase Credentials (git-ignored)
├── .gitignore            # Excludes node_modules, build outputs, and credentials
├── index.html            # Main HTML entry point
├── package.json          # Dependency definitions and npm scripts
├── vite.config.js        # Vite configurations (base path set for GitHub Pages)
└── src/
    ├── main.jsx          # React app entry point
    ├── index.css         # Custom CSS animations & Tailwind layers
    ├── firebase.js       # Firebase initialization & local-fallback detection
    ├── data/
    │   ├── DataContext.jsx # Global state management provider & DB logic
    │   └── loanData.js     # Default Excel-extracted static loan records
    └── components/
        ├── App.jsx       # App layout, page router & loading coordinator
        ├── Navbar.jsx    # Sticky navigation bar with live date status
        ├── Background.jsx# Dynamic dark mode animated mesh background
        ├── SectionTitle.js# Section header line
        ├── StatCard.jsx  # Individual KPI metric card with micro-animations
        ├── MasterSummary.jsx # Multi-source outstanding summaries and Recharts
        ├── JainPage.jsx  # JAIN disbursement schedules, repayment logs & summaries
        ├── HdfcPage.jsx  # HDFC tranche grids, interest schedules & repayments
        └── AdminPage.jsx # Inline Excel-like cell editor & DB connection manager
```

---

## ☁ Firebase Firestore Database Setup

This project uses **Firebase Firestore** as a serverless database backend. All changes saved on the `Admin` panel are committed to the cloud.

### 1. Database Initialization
1. Create a free project in the [Firebase Console](https://console.firebase.google.com/).
2. Click **Build > Firestore Database** in the sidebar, and select **Create database**.
3. Choose your nearest database location.

### 2. Configure Security Rules
In the **Rules** tab of your Firestore Database, replace the default configuration with the following to allow read and write access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
*Note: For production environments, rules can be updated to require authentication.*

### 3. Setup Local Credentials (`.env`)
Create a `.env` file in the root directory and paste your Firebase SDK credentials (these are kept safe and will not be pushed to GitHub):
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

---

## 🚀 Running Locally

To run the project on your local machine:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start the Dev Server**:
   ```bash
   npm run dev
   ```
3. **Open in Browser**: Navigate to `http://localhost:5173`.

---

## 📦 Deployment to GitHub Pages

Deploying your website live to GitHub Pages is fully automated. Simply run:

```bash
npm run deploy
```

This command will:
1. Trigger `predeploy` which builds your static site into the `dist/` directory.
2. Push the built files to the `gh-pages` branch of your repository.
3. Host it live on GitHub Pages under: `https://<your-username>.github.io/<your-repository-name>`
