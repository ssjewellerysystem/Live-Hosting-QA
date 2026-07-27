import os
import sys
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app import app
from backend.extensions import db
from backend.models.collection import CollectionModel

hardcoded_collections = [
    {
        "id": 1,
        "name": "New Collection",
        "slug": "new-collection",
        "subtitle": "Fresh Masterpieces & Solitaires",
        "image": None,
        "description": "Discover our latest exquisite handcrafted arrivals featuring modern solitaire designs and signature gold craft.",
        "tips": ["Pair with classic ensembles to stand out.", "Explore solitaire diamonds for timeless brilliance.", "Perfect as a memorable gift for special milestones."],
        "display_order": 1
    },
    {
        "id": 2,
        "name": "Wedding Wear",
        "slug": "wedding-wear",
        "subtitle": "Regal Heritage Kundan",
        "image": None,
        "description": "Ornate traditional bridal choker sets, heavy designer jhumkas, and matching hand ornaments. Tailored for classic royal elegance.",
        "tips": ["Complement heavily embroidered outfits with choker-length sets.", "Style with matching maang-tika for classic look.", "Incorporate natural pearls for color balance."],
        "display_order": 2
    },
    {
        "id": 3,
        "name": "Office Wear",
        "slug": "office-wear",
        "subtitle": "Minimalistic Luxury Studs",
        "image": None,
        "description": "Chic, lightweight, and modern daily-wear items. Understated solitaire bands, studs, and sleek bracelets designed for executive confidence.",
        "tips": ["Stick to one key statement piece (e.g. sleek studs or minimalist watch).", "Platinum/white-gold options work best with formal suits.", "Avoid noisy jingling bracelets."],
        "display_order": 3
    },
    {
        "id": 4,
        "name": "Daily Wear",
        "slug": "daily-wear",
        "subtitle": "Versatile Chic Bangles",
        "image": None,
        "description": "Comfortable, durable, yet elegant gold bands and bracelets. Built for regular wear while retaining luxurious gold textures.",
        "tips": ["Mix different gold karats for unique color play.", "Opt for smooth, snag-free lock styles.", "Great for layering alongside wristwatches."],
        "display_order": 4
    },
    {
        "id": 5,
        "name": "Date Night",
        "slug": "date-night",
        "subtitle": "Elegance & Layered Statements",
        "image": None,
        "description": "Perfect combinations of layered gold chains, subtle collar necklaces, and delicate hoops. Crafted to make statement memories under candlelit tables.",
        "tips": ["Pair with solid dark necklines to highlight gold textures.", "Layer 2-3 chains of varying lengths.", "Keep earrings minimal if layering necklaces."],
        "display_order": 5
    }
]

with app.app_context():
    migrated_count = 0
    updated_count = 0
    
    for item in hardcoded_collections:
        existing = CollectionModel.query.filter(
            (CollectionModel.name == item["name"]) | (CollectionModel.slug == item["slug"])
        ).first()
        
        tips_str = json.dumps(item["tips"])
        
        if existing:
            # Update missing fields to ensure full data richness
            existing.subtitle = item["subtitle"]
            existing.description = item["description"]
            existing.image = item["image"]
            existing.thumbnail_image = item["image"]
            existing.banner_image = item["image"]
            existing.styling_tips = tips_str
            existing.display_order = item["display_order"]
            existing.is_active = True
            updated_count += 1
            print(f"[MIGRATE] Updated existing collection record: '{existing.name}'")
        else:
            new_coll = CollectionModel(
                name=item["name"],
                slug=item["slug"],
                subtitle=item["subtitle"],
                description=item["description"],
                image=item["image"],
                thumbnail_image=item["image"],
                banner_image=item["image"],
                styling_tips=tips_str,
                display_order=item["display_order"],
                is_active=True
            )
            db.session.add(new_coll)
            migrated_count += 1
            print(f"[MIGRATE] Inserted new collection record: '{item['name']}'")
            
    db.session.commit()
    print(f"\n[SUMMARY] Total Collections in DB: {CollectionModel.query.count()}")
    print(f"[SUMMARY] Migrated: {migrated_count}, Updated: {updated_count}")
