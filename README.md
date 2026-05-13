# 🚨 Rapid Alert Nexus  

**A Real-Time Disaster Intelligence & Emergency Response Coordination System**

This project demonstrates a real-time disaster monitoring and response platform built using modern web technologies and event-driven architecture. It simulates how emergency alerts can be processed, filtered, and handled efficiently with live coordination between response teams.

---

## 🚀 Project Overview

Rapid Alert Nexus is designed to mimic a modern disaster management system where alerts are generated, processed through multiple stages, and converted into actionable dispatches.

### Key Highlights:
- Real-time communication using WebSockets  
- Multi-stage alert processing pipeline  
- Live response coordination system  
- Persistent logging and monitoring  

---

## 🛠️ Technologies Used

### 💻 Web Application
- **Frontend**: React (TypeScript), Vite  
- **Styling**: Tailwind CSS, shadcn/ui  
- **Routing**: React Router  
- **Visualization**: Leaflet (Maps), Recharts  

### ⚙️ Backend
- **Runtime**: Node.js  
- **Framework**: Express.js  
- **Real-Time Communication**: Socket.IO  

### 🧪 Testing
- Vitest  
- Playwright  

---

## 🏗️ System Architecture

### 🔁 Workflow Summary
1. Alert is generated (simulated disaster data)
2. Data passes through filtering pipeline
3. Valid alerts are processed and dispatched
4. Response teams update status via console
5. WebSocket syncs updates in real-time
6. Logs and history are stored for tracking

### 📁 Project Structure
```text
Rapid-Alert-Nexus/
│
├── backend/
│   ├── package.json
│   ├── server.js
│   └── data/
│       ├── db.json
│       ├── db2.json
│       ├── db3.json
│       └── db4.json
│
├── public/
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── AlertHeatMap.tsx
│   │   ├── DispatchReportDialog.tsx
│   │   ├── NavLink.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── TopNav.tsx
│   │   ├── WebSocketStatus.tsx
│   │   └── ui/
│   ├── context/
│   │   └── SimulationContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useSocket.ts
│   ├── lib/
│   │   ├── simulation-data.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── DataInputPage.tsx
│   │   ├── DispatchHistoryPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ProcessingPage.tsx
│   │   ├── RespondLoginPage.tsx
│   │   └── ResponseConsolePage.tsx
│   ├── test/
│   └── types/
│
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🧪 Features
- Real-time disaster alert simulation
- Data filtering and processing pipeline
- Interactive dashboard with heatmaps
- Smart dispatch and response system
- WebSocket-based live updates
- Response console for emergency teams
- Dispatch history with activity logs
- System analytics and statistics

---

## ⚙️ Setup & Installation

**1. Clone Repository**
```bash
git clone [https://github.com/amogh-sharanar28/Rapid-Alert-Nexus.git](https://github.com/amogh-sharanar28/Rapid-Alert-Nexus.git)
cd Rapid-Alert-Nexus
```

**2. Install Dependencies**
```bash
npm install
cd backend
npm install
cd ..
```

**3. Run Backend**
```bash
cd backend
npm start
```

**4. Run Frontend**
```bash
npm run dev
```

**5. Run Both Together (Optional)**
```bash
npm run dev:all
```

---

## 🔗 Application Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000

### 🔐 Response Console Access
- **Password:** `respond123`
- *Used to login into the Response Console page for team updates.*

---

## 📊 Data Management
| File | Purpose |
| :--- | :--- |
| `db.json` | Alerts, dispatches, responses |
| `db2.json` | Feedback filtering data |
| `db3.json` | Processing logs |
| `db4.json` | Login history |

---

## 🧰 Prerequisites
- Node.js & npm installed
- Basic understanding of React & Node.js
- Browser with developer tools

---

## 🔄 Manual Testing Flow
1. Start backend and frontend
2. Generate alerts
3. Create dispatch
4. Submit team response
5. Check dashboard updates
6. Verify logs in history

---

## 🚀 Future Enhancements
- AI-based alert classification
- Database integration (MongoDB/PostgreSQL)
- Role-based authentication (JWT)
- Docker-based deployment
- Integration with real-world APIs

---

## 👨‍💻 Author
**Suhan Jamadar**  
8th Semester CSE Student  
KLE MSSCET, Belagavi  
📧 suhanjforwork@gmail.com  
🌐 [GitHub Profile]((https://github.com/Suhan-Jamadar))  
🔗 [LinkedIn Profile](https://linkedin.com/in/suhan-jamadar)  

---

## 📞 Contact
Feel free to reach out for collaboration, improvements, or queries!  
- **Email:** suhanjforwork@gmail.com  
- **GitHub:** [Suhan-Jamadar](https://github.com/Suhan-Jamadar)  
- **LinkedIn:** [Suhan-Jamadar](https://linkedin.com/in/suhan-jamadar)
