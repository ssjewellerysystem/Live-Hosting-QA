import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app import app
from backend.extensions import db
from sqlalchemy import inspect, text

with app.app_context():
    insp = inspect(db.engine)
    existing_cols = [c['name'] for c in insp.get_columns('collections')]
    print("Existing collections columns:", existing_cols)
    
    with db.engine.connect() as conn:
        if 'subtitle' not in existing_cols:
            conn.execute(text("ALTER TABLE collections ADD COLUMN subtitle VARCHAR(255)"))
            print("Added subtitle column.")
        if 'styling_tips' not in existing_cols:
            conn.execute(text("ALTER TABLE collections ADD COLUMN styling_tips TEXT"))
            print("Added styling_tips column.")
        if 'image' not in existing_cols:
            conn.execute(text("ALTER TABLE collections ADD COLUMN image VARCHAR(512)"))
            print("Added image column.")
        conn.commit()
        
    updated_cols = [c['name'] for c in inspect(db.engine).get_columns('collections')]
    print("Updated collections columns:", updated_cols)
