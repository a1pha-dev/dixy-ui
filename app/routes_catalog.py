"""API routes for catalog, products, and promotions"""
from fastapi import APIRouter
from app.config import CATEGORIES, PRODUCTS, PROMOTIONS, USER_PROFILE

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/catalog")
async def get_catalog():
    """Get all product categories"""
    return {"categories": CATEGORIES}


@router.get("/products")
async def get_products():
    """Get featured products"""
    return {"products": PRODUCTS}


@router.get("/all-products")
async def get_all_products():
    """Get all products for shopping"""
    return {"products": PRODUCTS}


@router.get("/promotions")
async def get_promotions():
    """Get active promotions"""
    return {"promotions": PROMOTIONS}


@router.get("/profile")
async def get_profile():
    """Get user profile"""
    return {"user": USER_PROFILE}

