# Dixy UI - GitHub README

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/dixy-ui.git
cd dixy-ui

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

**Open:** http://127.0.0.1:8000

## 📱 Features

✅ **7 interactive screens**  
✅ **Quest system with statistics**  
✅ **Shopping cart with checkout**  
✅ **Real-time click tracking**  
✅ **Confetti animations**  
✅ **Mobile-optimized UI**  

## 🎮 Mission System

Each mission includes:
- ⏱️ Real-time timer
- 🖱️ Click counter (total + unnecessary)
- 📈 Accuracy calculation
- 🎉 Success celebration with confetti

## 📊 Statistics Tracked

- **Time spent** - mission completion time
- **Total clicks** - all user actions
- **Unnecessary clicks** - wasted clicks
- **Accuracy** - useful clicks percentage

## 🔗 API

```
GET  /api/mission/new              - Create new mission
GET  /api/mission/{id}             - Get mission details
POST /api/mission/{id}/complete    - Complete mission
GET  /api/catalog                  - Get categories
GET  /api/all-products             - Get all products
GET  /api/promotions               - Get promotions
GET  /api/profile                  - Get user profile
```

## 📂 Project Structure

```
app/
  ├── config.py         - Data & configuration
  ├── models.py         - Pydantic models
  ├── missions.py       - Quest logic
  ├── routes_catalog.py - Catalog API
  └── routes_missions.py - Mission API
templates/
  └── app.html          - Single Page App
main.py                - FastAPI entry point
```

## 🛠️ Tech Stack

- **Backend:** FastAPI + Uvicorn
- **Frontend:** Vanilla JavaScript + CSS
- **Data:** Pydantic models
- **Package:** Python 3.8+

## 📝 License

MIT

---

Made with ❤️ for A/B testing UI flows

