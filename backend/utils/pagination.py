import math
from flask import request

def parse_pagination_params(default_limit=20, max_limit=100):
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            page = 1
    except (TypeError, ValueError):
        page = 1

    try:
        limit = int(request.args.get('limit') or request.args.get('page_size') or default_limit)
        if limit < 1:
            limit = default_limit
        elif limit > max_limit:
            limit = max_limit
    except (TypeError, ValueError):
        limit = default_limit

    return page, limit

def paginate_query(query, page=None, limit=None, serializer=None, default_limit=20, max_limit=100):
    if page is None or limit is None:
        p, l = parse_pagination_params(default_limit=default_limit, max_limit=max_limit)
        page = page if page is not None else p
        limit = limit if limit is not None else l

    total_records = query.order_by(None).count()
    total_pages = math.ceil(total_records / limit) if total_records > 0 else 1

    if page > total_pages and total_pages > 0:
        page = total_pages

    offset = (page - 1) * limit
    records = query.offset(offset).limit(limit).all()

    if serializer:
        items = [serializer(rec) for rec in records]
    else:
        items = [rec.to_dict() if hasattr(rec, 'to_dict') else rec for rec in records]

    return {
        "items": items,
        "total_records": total_records,
        "total_pages": total_pages,
        "current_page": page,
        "page_size": limit,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }
