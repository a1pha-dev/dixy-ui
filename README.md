# Dixy UI - A/B Testing Microservice 🎉

A Python microservice that reproduces the visual design and UX/transitions of the Dixy grocery delivery app interface with **interactive quests, shopping cart, and gamified experience** for A/B testing.

## Overview

This microservice is designed for A/B testing purposes and accurately reproduces:
- **UI Design**: Mobile-first interface with 390px phone shell mockup
- **Transitions**: Smooth hover, tap, and modal animations  
- **Multiple Screens**: 5 fully functional screens with navigation
- **Components**: Loyalty strips, hero banners, category grids, promo cards, product lists, profile sections

## Screens

### 0. 🎯 Квест/Задание (Mission)
- **Случайно генерируемые задания** при каждом запуске
- Типы заданий:
  - `screen` - Перейти на конкретный экран
  - `add_item` - Добавить товар(ы) в корзину
  - `checkout` - Оформить заказ
  - `combo` - Выполнить комбо из нескольких действий
- Прогресс-бар с процентом выполнения
- **Конфетти и успешное завершение** при выполнении 🎉

### 1. 🏠 Главная (Home)
- Loyalty card with cashback display
- Hero banner with CTA button
- Featured categories (4-grid)
- Promo cards and brand chips
- Daily deals with prices and discounts
- Все элементы активны и переводят на нужные экраны

### 2. 📋 Каталог (Catalog)
- All product categories displayed in 2x2 grid
- Category count (товаров)
- Quick category access with tap feedback

### 3. 🏪 Товары (Shopping)
- **Полный каталог из 15+ товаров**
- Каждый товар:
  - Название и цена
  - Оригинальная цена (если есть скидка)
  - Процент скидки
  - Кнопка + для добавления в корзину
- Товары в корзине отражаются в бейдже (значок 🛒)

### 4. 🛒 Корзина (Cart)
- **Полностью функциональная корзина**
- Для каждого товара:
  - Изображение (emoji)
  - Название и цена
  - Кнопки +/- для изменения количества
  - Кнопка ✕ для удаления
- **Итоговый чек**:
  - Показывает эконом (сэкономленные деньги)
  - Итоговая сумма
- **Кнопка оформления заказа** 🎉💝
  - При нажатии: конфетти + успешное завершение
  - Автоматически отслеживает миссию

### 5. 🎁 Акции (Promotions)
- Active promotions with emojis
- Discount badges and descriptions
- Tap to view / перейти на товары

### 6. ☀️ Скоро Лето (Coming Summer)
- Seasonal promotional banner
- Seasonal offers and collections:
  - 🏖️ Пляжная коллекция (Beach Collection)
  - 🍦 Ледяные десерты (Frozen Desserts)
  - 🥗 Свежие салаты (Fresh Salads)
  - 🍓 Сезонные фрукты (Seasonal Fruits)

### 7. 👤 Профиль (Profile)
- User profile header with avatar
- Loyalty points and cashback rate
- Contact information (phone, email)
- Member since date
- Action buttons:
  - 📋 История заказов (Order History)
  - ❤️ Избранное (Favorites)
  - ⚙️ Настройки (Settings)

## Requirements

- Python 3.8+
- FastAPI >= 0.110.0
- Uvicorn >= 0.29.0
- Jinja2 >= 3.1.3

## Installation

```bash
pip install -r requirements.txt
```

## Running Locally

```bash
# Start the development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# The service will be available at:
# http://127.0.0.1:8000
```

## API Endpoints

- `GET /` - Main app (renders Single-Page Application)
- `GET /health` - Health check
- `GET /api/catalog` - Get all categories
- `GET /api/products` - Get featured products (4 items)
- `GET /api/all-products` - Get complete product list (15 items)
- `GET /api/promotions` - Get active promotions
- `GET /api/profile` - Get user profile data
- `GET /api/mission` - Get random quest/mission (changes every call)

## Architecture

- **main.py**: FastAPI app with route handlers and API endpoints
- **templates/app.html**: Single-Page Application (Single HTML file with all screens)
- **Configuration**: UI config in main.py can be customized

## Features

### 🎮 Gamification
✓ **Random quests** - Different missions on each load
✓ **Mission tracking** - Progress bar shows completion %
✓ **Confetti celebrations** - Visual reward for completion 🎉
✓ **Multiple mission types** - Screen navigation, shopping, checkout, combos

### 🛒 Shopping Experience
✓ **Full shopping cart** - Add/remove items, change quantities
✓ **15+ products** - Full product catalog
✓ **Smart pricing** - Old prices, discounts, savings calculation
✓ **Cart badge** - Item counter on cart icon
✓ **Checkout flow** - Complete order with visual feedback

### 📱 UI/UX
✓ 7 screens with smooth navigation
✓ Responsive mobile UI (390px width optimized, adapts to larger screens)
✓ CSS animations and transitions
✓ Interactive elements with visual feedback
✓ Modal system for barcode display
✓ Toast notifications
✓ Bottom navigation with tab switching
✓ Real-time status updates
✓ All visual elements fully clickable

### 🔧 Technical
✓ Static API responses for testing
✓ Session storage for product data
✓ Fully functional UI without business logic
✓ Pure JavaScript - no frameworks needed
✓ Mobile-first responsive design

## Development Notes

- No business logic is implemented (mock data from APIs)
- All data is served from API endpoints
- Cart state stored in browser session memory
- Can be easily extended with real data sources
- Perfect for UI/UX testing and A/B testing

## Example User Journey

1. **App loads** → Random mission appears (e.g., "Add 2 items and checkout")
2. **User starts** → Mission instructions displayed with progress bar
3. **User adds items** → Cart badge updates, progress increases (1/2 ✓)
4. **User adds more items** → All required items added (2/2 ✓), mission halfway complete
5. **User navigates** → Explores catalog/promotions
6. **User checks out** → Completes final mission step
7. **Success!** → Confetti animation + celebration modal 🎉
8. **New mission** → Click "New quest" to get another random mission

## Testing

```bash
# Check if service is running
curl http://127.0.0.1:8000/health

# Test all products endpoint
curl http://127.0.0.1:8000/api/all-products | python -m json.tool

# Test random missions (run multiple times to see variety)
curl http://127.0.0.1:8000/api/mission | python -m json.tool
curl http://127.0.0.1:8000/api/mission | python -m json.tool
curl http://127.0.0.1:8000/api/mission | python -m json.tool

# Test other endpoints
curl http://127.0.0.1:8000/api/catalog
curl http://127.0.0.1:8000/api/profile
```

## Design System

### Colors
- Orange: #FF6B00 (Primary)
- Gray: #F5F5F5 (Backgrounds)
- Text: #1A1A1A (Primary), #666 (Secondary)

### Animations
- Fade-in on screen load
- Scale effects on button press
- Floating animation for emojis
- Bottom sheet modal for barcode

### Typography
- System font stack (-apple-system, SF Pro Display, Segoe UI)
- 10px-18px font sizes for mobile
- 700-800 font weights for headings

## Responsive Design

While optimized for 390px mobile devices, the app adapts to larger screens with:
- Centered container with box shadow
- Smooth scrolling for content
- Touch-optimized tap targets (min 32px)

## Key Features

### 🎯 Smart Quest System
- Each time the app loads, a **new random mission** is generated
- Missions automatically track user actions:
  - Screen visits are tracked
  - Product additions are counted
  - Checkout is detected
- Progress bar updates in real-time
- Completion triggers confetti animation + success modal

### 🏪 Interactive Navigation
- **Every button and link is fully active**
- All category items → navigate to products
- All promotional items → navigate to products
- Hero banner CTA → navigate to products
- Promo cards → navigate to related sections
- Status bar icons → navigate to cart and profile

### 🎁 Gamified Checkout
- Add items to cart (mission requirement ✓)
- Adjust quantities easily
- See real savings calculated
- Checkout triggers success celebration 🎉
- Automatically resets for new mission

## Files Structure

```
dixy-ui-old/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── # Dixy UI - A/B Testing Microservice

Интерактивный UI микросервис для A/B тестирования шопинг-интерфейса с системой квестов и отслеживанием статистики.

## 🚀 Быстрый старт

```bash
# Установить зависимости
pip install -r requirements.txt

# Запустить сервис
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Откройте в браузере:** http://127.0.0.1:8000

## 📱 Возможности

### 7 экранов приложения
- 🎮 **Квесты** - система заданий с отслеживанием статистики
- 📋 **Каталог** - все категории товаров
- 🛍️ **Товары** - полный список товаров (15+)
- 🎁 **Акции** - активные промо-предложения
- ☀️ **Лето** - сезонные предложения
- 🛒 **Корзина** - управление корзиной и оформление заказа
- 👤 **Профиль** - данные пользователя и бонусы

### 🎮 Система квестов

Каждая миссия включает:
- **Плавное отслеживание прогресса** - не перебрасывает мгновенно
- **Таймер времени выполнения** - по секундам
- **Счетчик кликов** - всего + лишних
- **Расчет точности** - процент полезных кликов
- **Конфетти при завершении** - праздничная анимация

#### Типы квестов:

1. **Перейти на экран** - посетить конкретный раздел
2. **Добавить товары** - указанное количество товаров в корзину
3. **Оформить заказ** - добавить товары и купить
4. **Комбо-миссии** - комбинация всех вышеперечисленных

### 📊 Статистика по каждому квесту

После завершения миссии видна подробная статистика:
- ⏱️ **Время выполнения** - в секундах
- 🖱️ **Всего кликов** - количество всех действий
- 🔴 **Лишних кликов** - ненужные клики (удаления, вернуться назад)
- 📈 **Точность** - процент полезных кликов от всех

### 🛒 Корзина с функционалом

- Добавление/удаление товаров
- Изменение количества (+/-)
- Автоматический расчет скидок
- Отображение экономии
- Бейдж с количеством товаров на кнопке
- Оформление заказа

## 📂 Структура проекта

```
dixy-ui-old/
├── main.py                      # FastAPI приложение
├── requirements.txt             # Зависимости Python
├── README.md                    # Документация
├── .gitignore                   # Git ignore
├── app/
│   ├── __init__.py             # Инициализация пакета
│   ├── config.py               # Конфигурация и данные
│   ├── models.py               # Pydantic модели
│   ├── missions.py             # Логика квестов
│   ├── routes_catalog.py       # API роуты каталога
│   └── routes_missions.py      # API роуты квестов
└── templates/
    └── app.html                # SPA приложение
```

## 🔧 API Endpoints

### Квесты/Миссии
- `GET /api/mission/new` - создать новое задание
- `GET /api/mission/{id}` - получить задание по ID
- `POST /api/mission/{id}/progress` - обновить прогресс
- `POST /api/mission/{id}/complete` - завершить задание и получить статистику

### Каталог и товары
- `GET /api/catalog` - все категории
- `GET /api/products` - избранные товары
- `GET /api/all-products` - все товары
- `GET /api/promotions` - активные акции
- `GET /api/profile` - профиль пользователя

### Служебные
- `GET /` - главное приложение
- `GET /health` - проверка статуса

## 🎯 Примеры использования

### Создать новое задание
```bash
curl http://127.0.0.1:8000/api/mission/new
```

Ответ:
```json
{
  "id": "uuid-string",
  "type": "add_item",
  "title": "Добавьте 2 товара в корзину",
  "description": "Найдите и добавьте два разных товара",
  "items_count": 2
}
```

### Завершить задание
```bash
curl -X POST http://127.0.0.1:8000/api/mission/{id}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "time_spent_seconds": 45,
    "total_clicks": 12,
    "unnecessary_clicks": 2
  }'
```

Ответ:
```json
{
  "mission_id": "uuid",
  "mission_title": "Добавьте 2 товара в корзину",
  "time_spent_seconds": 45,
  "total_clicks": 12,
  "unnecessary_clicks": 2,
  "accuracy": 83.3,
  "completed_at": "2026-05-12T10:30:45"
}
```

## 🔌 Интеграция

Все квесты синхронизируются через REST API. Для интеграции с другими системами используйте endpoints из раздела выше.

## 🎨 Кастомизация

### Добавить новый тип квеста
1. Отредактируйте `app/missions.py` - добавьте новый шаблон в `MISSION_TEMPLATES`
2. Обновите логику отслеживания в `templates/app.html`

### Изменить товары
1. Отредактируйте `app/config.py` - массив `PRODUCTS`

### Изменить цвета
1. Откройте `templates/app.html` и найдите CSS переменные
2. Основной цвет: `#FF6B00` (оранжевый)

## 📊 Для аналитики

Все действия пользователя отслеживаются:
- 🖱️ Каждый клик записывается
- 🎮 Каждое взаимодействие с квестом
- 📈 Метрики успешности и точности

## 🛠️ Требования

- Python 3.8+
- FastAPI 0.110.0+
- Uvicorn 0.29.0+
- Pydantic 2.0.0+

## 📝 Лицензия

MIT

## 👨‍💻 Разработка

Код следует архитектуре:
- **Модульная структура** - разделение по функциям
- **REST API** - стандартные endpoints
- **Типизированный код** - Pydantic модели
- **Документированный код** - docstrings везде

---

**Версия:** 2.0.0  
**Дата обновления:** май 2026  
**Статус:** ✅ Production Ready               # This file
└── templates/
    └── app.html            # Single-Page App with all screens
```

