"""
Collection Banner Routes Re-export Module.
Provides alias exports (collection_banner_bp and collection_banners_bp)
to ensure compatibility regardless of deployment runner import patterns.
"""
from backend.routes.collection_banners import collection_banners_bp, get_all_collection_banners

collection_banner_bp = collection_banners_bp

__all__ = ['collection_banners_bp', 'collection_banner_bp', 'get_all_collection_banners']
