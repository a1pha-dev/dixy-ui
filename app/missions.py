"""Mission/Quest generation and management"""
import random
import uuid
from datetime import datetime
from typing import Dict, List, Any
from app.models import Mission, MissionType, MissionStats


class MissionGenerator:
    """Generate and manage missions"""

    MISSION_TEMPLATES = [
        {
            "type": MissionType.SCREEN,
            "title": "Откройте каталог товаров",
            "description": "Перейдите на экран 'Каталог' и посмотрите доступные категории",
            "target_screen": "catalog",
        },
        {
            "type": MissionType.SCREEN,
            "title": "Посмотрите профиль",
            "description": "Перейдите в ваш профиль и проверьте информацию",
            "target_screen": "profile",
        },
        {
            "type": MissionType.SCREEN,
            "title": "Проверьте акции",
            "description": "Откройте раздел 'Акции' и выберите интересующее предложение",
            "target_screen": "promo",
        },
        {
            "type": MissionType.SCREEN,
            "title": "Откройте раздел Лето",
            "description": "Посмотрите сезонные предложения на лето",
            "target_screen": "summer",
        },
        {
            "type": MissionType.ADD_ITEM,
            "title": "Добавьте товар в корзину",
            "description": "Выберите любой товар и добавьте его в корзину",
            "items_count": 1,
        },
        {
            "type": MissionType.ADD_ITEM,
            "title": "Добавьте 2 товара в корзину",
            "description": "Найдите и добавьте два разных товара",
            "items_count": 2,
        },
        {
            "type": MissionType.ADD_ITEM,
            "title": "Соберите 3 товара",
            "description": "Добавьте в корзину три разных товара на выбор",
            "items_count": 3,
        },
        {
            "type": MissionType.CHECKOUT,
            "title": "Оформите заказ",
            "description": "Добавьте товары и нажмите 'Оформить покупку'",
            "items_count": 1,
        },
        {
            "type": MissionType.COMBO,
            "title": "Исследуй магазин и купи!",
            "description": "Посетите каталог, добавьте 2 товара и оформите заказ",
            "required_subtasks": ["screen_catalog", "add_item", "add_item", "checkout"],
        },
        {
            "type": MissionType.COMBO,
            "title": "Полное путешествие по магазину",
            "description": "Откройте профиль, посмотрите акции, добавьте товар и купите",
            "required_subtasks": ["screen_profile", "screen_promo", "add_item", "checkout"],
        },
    ]

    def __init__(self):
        self.current_missions: Dict[str, Dict[str, Any]] = {}

    def generate_mission(self) -> Dict[str, Any]:
        """Generate a new random mission"""
        mission_data = random.choice(self.MISSION_TEMPLATES).copy()
        mission_id = str(uuid.uuid4())

        mission = {
            "id": mission_id,
            "type": mission_data["type"],
            "title": mission_data["title"],
            "description": mission_data.get("description", ""),
            "target_screen": mission_data.get("target_screen"),
            "items_count": mission_data.get("items_count", 1),
            "required_subtasks": mission_data.get("required_subtasks", []),
            "start_time": datetime.now().isoformat(),
            "completed": False,
        }

        self.current_missions[mission_id] = mission
        return mission

    def get_mission(self, mission_id: str) -> Dict[str, Any]:
        """Get mission by ID"""
        return self.current_missions.get(mission_id)

    def update_mission_progress(self, mission_id: str, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update mission progress without completing"""
        mission = self.current_missions.get(mission_id)
        if mission:
            mission.update(progress_data)
            return mission
        return None

    def complete_mission(self, mission_id: str, stats: Dict[str, Any]) -> MissionStats:
        """Mark mission as completed and calculate stats"""
        mission = self.current_missions.get(mission_id)
        if not mission:
            return None

        mission["completed"] = True
        mission["end_time"] = datetime.now().isoformat()

        # Calculate statistics
        total_clicks = stats.get("total_clicks", 0)
        unnecessary_clicks = stats.get("unnecessary_clicks", 0)
        useful_clicks = total_clicks - unnecessary_clicks
        accuracy = (useful_clicks / total_clicks * 100) if total_clicks > 0 else 0

        mission_stats = MissionStats(
            mission_id=mission_id,
            mission_title=mission["title"],
            time_spent_seconds=stats.get("time_spent_seconds", 0),
            total_clicks=total_clicks,
            unnecessary_clicks=unnecessary_clicks,
            accuracy=round(accuracy, 1),
            completed_at=datetime.now().isoformat(),
        )

        mission["stats"] = mission_stats.model_dump()
        return mission_stats


# Global mission generator
mission_generator = MissionGenerator()

