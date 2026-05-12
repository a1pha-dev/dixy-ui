"""Data models"""
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class MissionType(str, Enum):
    """Mission types"""
    SCREEN = "screen"
    ADD_ITEM = "add_item"
    CHECKOUT = "checkout"
    COMBO = "combo"


class Mission(BaseModel):
    """Quest/Mission model"""
    id: str
    type: MissionType
    title: str
    description: Optional[str] = None
    target_screen: Optional[str] = None
    items_count: int = 1
    required_subtasks: List[str] = []


class MissionStats(BaseModel):
    """Statistics for completed mission"""
    mission_id: str
    mission_title: str
    time_spent_seconds: int
    total_clicks: int
    unnecessary_clicks: int
    accuracy: float  # 0-100, percentage of useful clicks
    completed_at: str


class Product(BaseModel):
    """Product model"""
    id: int
    name: str
    price: float
    old_price: Optional[float] = None
    emoji: str
    discount: Optional[str] = None
    category: str


class Category(BaseModel):
    """Category model"""
    id: int
    name: str
    emoji: str
    count: int


class Promotion(BaseModel):
    """Promotion model"""
    id: int
    title: str
    description: str
    emoji: str
    discount: str


class User(BaseModel):
    """User profile model"""
    name: str
    email: str
    phone: str
    status: str
    loyalty_points: int
    cashback_rate: str
    avatar: str
    member_since: str


class CartItem(BaseModel):
    """Item in cart"""
    product_id: int
    quantity: int
    name: str
    price: float


class Cart(BaseModel):
    """Shopping cart"""
    items: List[CartItem] = []
    total: float = 0
    discount: float = 0

