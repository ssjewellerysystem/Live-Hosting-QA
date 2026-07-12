import os

def main():
    # Make directories
    os.makedirs("docs/html", exist_ok=True)
    os.makedirs("docs/images", exist_ok=True)

    base_css = """
    :root {
        --bg-main: #0b0f19;
        --bg-card: #151e33;
        --bg-editor: #0c1020;
        --text-main: #f8fafc;
        --text-sub: #94a3b8;
        --accent: #3b82f6;
        --accent-glow: rgba(59, 130, 246, 0.15);
        --accent-green: #10b981;
        --accent-gold: #f59e0b;
        --accent-red: #ef4444;
        --border-color: #2e3b5e;
        --code-keyword: #ff79c6;
        --code-string: #f1fa8c;
        --code-comment: #6272a4;
        --code-func: #50fa7b;
        --code-class: #8be9fd;
        --code-var: #f8f8f2;
    }
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    body {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: var(--bg-main);
        color: var(--text-main);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 40px 20px;
        overflow-x: hidden;
    }
    .container {
        width: 100%;
        max-width: 1200px;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        padding: 30px;
        position: relative;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 20px;
        margin-bottom: 25px;
    }
    .header-left h1 {
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 5px;
    }
    .header-left p {
        font-size: 14px;
        color: var(--text-sub);
    }
    .status-badge {
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--accent-green);
        color: var(--accent-green);
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .content-grid {
        display: grid;
        grid-template-columns: 7fr 5fr;
        gap: 25px;
    }
    /* macOS-style Window Decorator */
    .editor-wrapper {
        background-color: var(--bg-editor);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    .editor-titlebar {
        background-color: rgba(15, 23, 42, 0.8);
        border-bottom: 1px solid var(--border-color);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        position: relative;
    }
    .window-dots {
        display: flex;
        gap: 8px;
    }
    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    .dot-red { background-color: var(--accent-red); }
    .dot-yellow { background-color: var(--accent-gold); }
    .dot-green { background-color: var(--accent-green); }
    .file-path {
        font-family: 'Fira Code', monospace;
        font-size: 12px;
        color: var(--text-sub);
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-weight: 500;
    }
    .code-container {
        padding: 20px;
        overflow-x: auto;
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.5;
        color: var(--code-var);
    }
    .code-line {
        display: flex;
    }
    .line-num {
        width: 30px;
        color: var(--code-comment);
        text-align: right;
        margin-right: 20px;
        user-select: none;
        border-right: 1px solid rgba(255,255,255,0.05);
        padding-right: 8px;
    }
    .line-content {
        white-space: pre;
    }
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .side-card {
        background-color: rgba(255,255,255,0.02);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
    }
    .side-card h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
        color: var(--text-main);
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 8px;
    }
    .table-badge {
        background-color: var(--accent-glow);
        border: 1px solid var(--accent);
        color: #93c5fd;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-family: 'Fira Code', monospace;
        font-weight: 600;
    }
    .op-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
    }
    .op-read { background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .op-write { background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .op-delete { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    
    .table-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .table-item {
        background-color: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 12px;
    }
    .table-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .table-item-desc {
        font-size: 13px;
        color: var(--text-sub);
        line-height: 1.4;
    }
    .flow-step {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }
    .flow-num {
        background-color: var(--accent);
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
    }
    .flow-desc {
        font-size: 13px;
        color: var(--text-sub);
        line-height: 1.4;
    }
    .keyword { color: var(--code-keyword); font-weight: 600; }
    .string { color: var(--code-string); }
    .comment { color: var(--code-comment); font-style: italic; }
    .func { color: var(--code-func); }
    .class { color: var(--code-class); font-weight: 600; }
    """

    # 1. User & Identity
    html_user = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BharatBasket User & Identity DB-Code Mapping</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{base_css}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>BharatBasket DB-Code Mapping: User & Identity Module</h1>
                <p>Maps table interactions for user accounts, credentials, OTP verification, address book, and shopping sessions (Cart & Wishlist)</p>
            </div>
            <div class="header-right">
                <span class="status-badge">Identity Module</span>
            </div>
        </div>
        <div class="content-grid">
            <div class="editor-wrapper">
                <div class="editor-titlebar">
                    <div class="window-dots">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                    </div>
                    <div class="file-path">backend/models/user.py</div>
                </div>
                <div class="code-container">
                    <div class="code-line"><span class="line-num">1</span><span class="line-content"><span class="keyword">class</span> <span class="class">UserModel</span>(db.Model):</span></div>
                    <div class="code-line"><span class="line-num">2</span><span class="line-content">    __tablename__ = <span class="string">'users'</span></span></div>
                    <div class="code-line"><span class="line-num">3</span><span class="line-content">    id = db.Column(db.Integer, primary_key=<span class="keyword">True</span>)</span></div>
                    <div class="code-line"><span class="line-num">4</span><span class="line-content">    email = db.Column(db.String(<span class="keyword">120</span>), unique=<span class="keyword">True</span>, nullable=<span class="keyword">False</span>)</span></div>
                    <div class="code-line"><span class="line-num">5</span><span class="line-content">    password = db.Column(db.String(<span class="keyword">128</span>), nullable=<span class="keyword">False</span>)</span></div>
                    <div class="code-line"><span class="line-num">6</span><span class="line-content">    address = db.relationship(<span class="string">'DeliveryAddress'</span>, backref=<span class="string">'user'</span>, uselist=<span class="keyword">False</span>, cascade=<span class="string">'all, delete-orphan'</span>)</span></div>
                    <div class="code-line"><span class="line-num">7</span><span class="line-content">    cart = db.relationship(<span class="string">'Cart'</span>, backref=<span class="string">'user'</span>, uselist=<span class="keyword">False</span>, cascade=<span class="string">'all, delete-orphan'</span>)</span></div>
                    <div class="code-line"><span class="line-num">8</span><span class="line-content"></span></div>
                    <div class="code-line"><span class="line-num">9</span><span class="line-content">    <span class="keyword">@staticmethod</span></span></div>
                    <div class="code-line"><span class="line-num">10</span><span class="line-content">    <span class="keyword">def</span> <span class="func">create_user</span>(name, email, password, mobile, address_dict, is_admin=<span class="keyword">False</span>):</span></div>
                    <div class="code-line"><span class="line-num">11</span><span class="line-content">        <span class="comment"># Password hashing via bcrypt</span></span></div>
                    <div class="code-line"><span class="line-num">12</span><span class="line-content">        hashed_pwd = bcrypt.generate_password_hash(password).decode(<span class="string">'utf-8'</span>)</span></div>
                    <div class="code-line"><span class="line-num">13</span><span class="line-content">        user = <span class="class">UserModel</span>(full_name=name, email=email, password=hashed_pwd, phone=mobile, is_admin=is_admin)</span></div>
                    <div class="code-line"><span class="line-num">14</span><span class="line-content">        db.session.add(user)</span></div>
                    <div class="code-line"><span class="line-num">15</span><span class="line-content">        db.session.flush() <span class="comment"># Get user.id</span></span></div>
                    <div class="code-line"><span class="line-num">16</span><span class="line-content">        </span></div>
                    <div class="code-line"><span class="line-num">17</span><span class="line-content">        <span class="comment"># Add Delivery Address</span></span></div>
                    <div class="code-line"><span class="line-num">18</span><span class="line-content">        addr = <span class="class">DeliveryAddress</span>(user_id=user.id, street=address_dict.get(<span class="string">'street'</span>), </span></div>
                    <div class="code-line"><span class="line-num">19</span><span class="line-content">                               city=address_dict.get(<span class="string">'city'</span>), state=address_dict.get(<span class="string">'state'</span>), </span></div>
                    <div class="code-line"><span class="line-num">20</span><span class="line-content">                               pincode=address_dict.get(<span class="string">'pincode'</span>))</span></div>
                    <div class="code-line"><span class="line-num">21</span><span class="line-content">        db.session.add(addr)</span></div>
                    <div class="code-line"><span class="line-num">22</span><span class="line-content">        </span></div>
                    <div class="code-line"><span class="line-num">23</span><span class="line-content">        <span class="comment"># Initialize Empty Cart</span></span></div>
                    <div class="code-line"><span class="line-num">24</span><span class="line-content">        cart = <span class="class">Cart</span>(user_id=user.id)</span></div>
                    <div class="code-line"><span class="line-num">25</span><span class="line-content">        db.session.add(cart)</span></div>
                    <div class="code-line"><span class="line-num">26</span><span class="line-content">        db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">27</span><span class="line-content">        <span class="keyword">return</span> user.to_dict()</span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="side-card">
                    <h3>Mapped Database Tables</h3>
                    <div class="table-list">
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">users</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores profile data, login info, and status indicators. Triggers cascade deletes on sessions.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">delivery_addresses</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Linked one-to-one to user. Handles street address, city, state, and pin code. Deleted if user profile is dropped.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">carts</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Assigned one-to-one to user to manage active cart items. Created on registration.</div>
                        </div>
                    </div>
                </div>
                <div class="side-card">
                    <h3>Data Flow Diagram</h3>
                    <div class="flow-step">
                        <div class="flow-num">1</div>
                        <div class="flow-desc">Front-end calls /register or checkout-login endpoint.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">2</div>
                        <div class="flow-desc">Backend hashes password using bcrypt & inserts row in users table.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">3</div>
                        <div class="flow-desc">Linked rows are concurrently written in delivery_addresses and carts.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # 2. Catalog & Inventory
    html_product = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BharatBasket Catalog & Inventory DB-Code Mapping</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{base_css}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>BharatBasket DB-Code Mapping: Catalog & Inventory Module</h1>
                <p>Maps tables for products, multilingual translation, stock tracking, audit logs, out-of-stock buy requests, reviews, and categories</p>
            </div>
            <div class="header-right">
                <span class="status-badge">Catalog Module</span>
            </div>
        </div>
        <div class="content-grid">
            <div class="editor-wrapper">
                <div class="editor-titlebar">
                    <div class="window-dots">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                    </div>
                    <div class="file-path">backend/models/product.py</div>
                </div>
                <div class="code-container">
                    <div class="code-line"><span class="line-num">1</span><span class="line-content"><span class="keyword">class</span> <span class="class">ProductModel</span>(db.Model):</span></div>
                    <div class="code-line"><span class="line-num">2</span><span class="line-content">    __tablename__ = <span class="string">'products'</span></span></div>
                    <div class="code-line"><span class="line-num">3</span><span class="line-content">    id = db.Column(db.Integer, primary_key=<span class="keyword">True</span>)</span></div>
                    <div class="code-line"><span class="line-num">4</span><span class="line-content">    stock = db.Column(db.Integer, nullable=<span class="keyword">False</span>, default=<span class="keyword">0</span>)</span></div>
                    <div class="code-line"><span class="line-num">5</span><span class="line-content"></span></div>
                    <div class="code-line"><span class="line-num">6</span><span class="line-content">    <span class="keyword">@staticmethod</span></span></div>
                    <div class="code-line"><span class="line-num">7</span><span class="line-content">    <span class="keyword">def</span> <span class="func">update_stock</span>(product_id, amount, change_type=<span class="string">'sale'</span>):</span></div>
                    <div class="code-line"><span class="line-num">8</span><span class="line-content">        prod = <span class="class">ProductModel</span>.query.get(product_id)</span></div>
                    <div class="code-line"><span class="line-num">9</span><span class="line-content">        old_stock = prod.stock</span></div>
                    <div class="code-line"><span class="line-num">10</span><span class="line-content">        prod.stock += amount</span></div>
                    <div class="code-line"><span class="line-num">11</span><span class="line-content">        </span></div>
                    <div class="code-line"><span class="line-num">12</span><span class="line-content">        # Log to stock_history (ON DELETE CASCADE applies if product is deleted)</span></div>
                    <div class="code-line"><span class="line-num">13</span><span class="line-content">        hist = <span class="class">StockHistoryModel</span>(product_id=prod.id, change_type=change_type, </span></div>
                    <div class="code-line"><span class="line-num">14</span><span class="line-content">                                   change_amount=amount, old_stock=old_stock, new_stock=prod.stock)</span></div>
                    <div class="code-line"><span class="line-num">15</span><span class="line-content">        db.session.add(hist)</span></div>
                    <div class="code-line"><span class="line-num">16</span><span class="line-content">        db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">17</span><span class="line-content"></span></div>
                    <div class="code-line"><span class="line-num">18</span><span class="line-content">    <span class="keyword">@staticmethod</span></span></div>
                    <div class="code-line"><span class="line-num">19</span><span class="line-content">    <span class="keyword">def</span> <span class="func">delete_product</span>(id):</span></div>
                    <div class="code-line"><span class="line-num">20</span><span class="line-content">        prod = <span class="class">ProductModel</span>.query.get(id)</span></div>
                    <div class="code-line"><span class="line-num">21</span><span class="line-content">        <span class="keyword">if</span> prod:</span></div>
                    <div class="code-line"><span class="line-num">22</span><span class="line-content">            # Cascades delete to product_images, variants, reviews, stock history</span></div>
                    <div class="code-line"><span class="line-num">23</span><span class="line-content">            db.session.delete(prod)</span></div>
                    <div class="code-line"><span class="line-num">24</span><span class="line-content">            db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">25</span><span class="line-content">            <span class="keyword">return</span> <span class="keyword">True</span></span></div>
                    <div class="code-line"><span class="line-num">26</span><span class="line-content">        <span class="keyword">return</span> <span class="keyword">False</span></span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="side-card">
                    <h3>Mapped Database Tables</h3>
                    <div class="table-list">
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">products</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Holds core item details, localized titles/descriptions (English & Hindi), price, ratings, and active status.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">stock_history</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Logs delta changes in stock numbers, including the change reasons (e.g. Sales, Restock, Admin Edit).</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">buy_requests</span>
                                <span class="op-badge op-read">Read</span>
                            </div>
                            <div class="table-item-desc">Stores purchase requests for out-of-stock items, used to bypass stock checks on restocking.</div>
                        </div>
                    </div>
                </div>
                <div class="side-card">
                    <h3>Relationships & Cascades</h3>
                    <div class="flow-step">
                        <div class="flow-num">C</div>
                        <div class="flow-desc">Deleting a product triggers ON DELETE CASCADE for: product_images, product_variants, reviews, stock_history, and buy_requests.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">S</div>
                        <div class="flow-desc">It triggers SET NULL on: categories, order_items.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # 3. Orders & Transactions
    html_order = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BharatBasket Orders & Transactions DB-Code Mapping</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{base_css}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>BharatBasket DB-Code Mapping: Orders & Transactions Module</h1>
                <p>Maps checkout flows, order placements, transaction auditing, and notification delivery</p>
            </div>
            <div class="header-right">
                <span class="status-badge">Sales & Fulfillment</span>
            </div>
        </div>
        <div class="content-grid">
            <div class="editor-wrapper">
                <div class="editor-titlebar">
                    <div class="window-dots">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                    </div>
                    <div class="file-path">backend/routes/orders.py</div>
                </div>
                <div class="code-container">
                    <div class="code-line"><span class="line-num">1</span><span class="line-content"><span class="keyword">@orders_bp.route</span>(<span class="string">''</span>, methods=[<span class="string">'POST'</span>])</span></div>
                    <div class="code-line"><span class="line-num">2</span><span class="line-content"><span class="keyword">@token_required</span></span></div>
                    <div class="code-line"><span class="line-num">3</span><span class="line-content"><span class="keyword">def</span> <span class="func">create_order</span>(current_user):</span></div>
                    <div class="code-line"><span class="line-num">4</span><span class="line-content">    # 1. Decrease Stock Level for items</span></div>
                    <div class="code-line"><span class="line-num">5</span><span class="line-content">    <span class="keyword">for</span> item <span class="keyword">in</span> items:</span></div>
                    <div class="code-line"><span class="line-num">6</span><span class="line-content">        <span class="class">ProductModel</span>.update_stock(item[<span class="string">'product_id'</span>], -item[<span class="string">'qty'</span>])</span></div>
                    <div class="code-line"><span class="line-num">7</span><span class="line-content">        </span></div>
                    <div class="code-line"><span class="line-num">8</span><span class="line-content">    # 2. Write order details to DB</span></div>
                    <div class="code-line"><span class="line-num">9</span><span class="line-content">    order = <span class="class">OrderModel</span>.create_order(user_id=current_user[<span class="string">'_id'</span>], items=items, total_amount=total)</span></div>
                    <div class="code-line"><span class="line-num">10</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">11</span><span class="line-content">    # 3. Initialize Transaction</span></div>
                    <div class="code-line"><span class="line-num">12</span><span class="line-content">    tx = <span class="class">Transaction</span>(order_id=order[<span class="string">'id'</span>], transaction_id=str(uuid.uuid4()), </span></div>
                    <div class="code-line"><span class="line-num">13</span><span class="line-content">                     amount=total, payment_method=payment_method, status=<span class="string">'Completed'</span>)</span></div>
                    <div class="code-line"><span class="line-num">14</span><span class="line-content">    db.session.add(tx)</span></div>
                    <div class="code-line"><span class="line-num">15</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">16</span><span class="line-content">    # 4. Clear user's Shopping Cart</span></div>
                    <div class="code-line"><span class="line-num">17</span><span class="line-content">    <span class="class">UserModel</span>.update_cart(current_user[<span class="string">'_id'</span>], [])</span></div>
                    <div class="code-line"><span class="line-num">18</span><span class="line-content">    db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">19</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">20</span><span class="line-content">    # 5. Push real-time status alerts</span></div>
                    <div class="code-line"><span class="line-num">21</span><span class="line-content">    add_user_notification(current_user[<span class="string">'_id'</span>], <span class="string">"Order Placed"</span>, f<span class="string">"Order placed successfully!"</span>)</span></div>
                    <div class="code-line"><span class="line-num">22</span><span class="line-content">    add_admin_notification(title=<span class="string">"New Order"</span>, message=f<span class="string">"Order placed."</span>)</span></div>
                    <div class="code-line"><span class="line-num">23</span><span class="line-content">    <span class="keyword">return</span> jsonify(order), <span class="keyword">201</span></span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="side-card">
                    <h3>Mapped Database Tables</h3>
                    <div class="table-list">
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">orders</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores high-level invoice data, shipping addresses (JSON), tracking history array, and status details.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">order_items</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Holds specific snapshot details of the purchased products (quantity, billing prices, custom names).</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">transactions</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores payment processor ID, final transaction amounts, payment strategies, and execution logs.</div>
                        </div>
                    </div>
                </div>
                <div class="side-card">
                    <h3>Fulfillment Flow</h3>
                    <div class="flow-step">
                        <div class="flow-num">1</div>
                        <div class="flow-desc">Inventory levels are decremented dynamically.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">2</div>
                        <div class="flow-desc">Transactions record are safely created and locked.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">3</div>
                        <div class="flow-desc">Notifications are distributed to both the customer and admin team.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # 4. Admin & Marketing
    html_admin = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BharatBasket Admin & Marketing DB-Code Mapping</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{base_css}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>BharatBasket DB-Code Mapping: Admin & Marketing Module</h1>
                <p>Maps system administration audit logs, administrative system alerts, banners, and coupon promotions</p>
            </div>
            <div class="header-right">
                <span class="status-badge">System Administration</span>
            </div>
        </div>
        <div class="content-grid">
            <div class="editor-wrapper">
                <div class="editor-titlebar">
                    <div class="window-dots">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                    </div>
                    <div class="file-path">backend/routes/admin.py</div>
                </div>
                <div class="code-container">
                    <div class="code-line"><span class="line-num">1</span><span class="line-content"><span class="keyword">@admin_bp.route</span>(<span class="string">'/users/&lt;id&gt;/status'</span>, methods=[<span class="string">'PUT'</span>])</span></div>
                    <div class="code-line"><span class="line-num">2</span><span class="line-content"><span class="keyword">@admin_required</span></span></div>
                    <div class="code-line"><span class="line-num">3</span><span class="line-content"><span class="keyword">def</span> <span class="func">update_user_status</span>(id):</span></div>
                    <div class="code-line"><span class="line-num">4</span><span class="line-content">    # 1. Update user block status in user model</span></div>
                    <div class="code-line"><span class="line-num">5</span><span class="line-content">    user = <span class="class">UserModel</span>.query.get(int(id))</span></div>
                    <div class="code-line"><span class="line-num">6</span><span class="line-content">    user.is_blocked = data.get(<span class="string">'is_blocked'</span>)</span></div>
                    <div class="code-line"><span class="line-num">7</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">8</span><span class="line-content">    # 2. Write User Status Audit Trail</span></div>
                    <div class="code-line"><span class="line-num">9</span><span class="line-content">    audit = <span class="class">UserStatusAuditLog</span>(user_id=user.id, admin_id=admin, </span></div>
                    <div class="code-line"><span class="line-num">10</span><span class="line-content">                               status_changed_to=status, reason=reason)</span></div>
                    <div class="code-line"><span class="line-num">11</span><span class="line-content">    db.session.add(audit)</span></div>
                    <div class="code-line"><span class="line-num">12</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">13</span><span class="line-content">    # 3. Write General System Admin Action Log</span></div>
                    <div class="code-line"><span class="line-num">14</span><span class="line-content">    log_admin_action(<span class="string">"User Blocked"</span>, <span class="string">"User Management"</span>, f<span class="string">"Blocked User: {user.email}"</span>)</span></div>
                    <div class="code-line"><span class="line-num">15</span><span class="line-content">    db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">16</span><span class="line-content">    <span class="keyword">return</span> jsonify({<span class="string">"success"</span>: <span class="keyword">True</span>})</span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="side-card">
                    <h3>Mapped Database Tables</h3>
                    <div class="table-list">
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">admins</span>
                                <span class="op-badge op-read">Read</span>
                            </div>
                            <div class="table-item-desc">Holds credentials for authorized staff members, administrators, and dashboard managers.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">admin_audit_logs</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Maintains read-only logs of critical operations executed by admin personnel.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">coupons</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores promotion codes, percentage/fixed discounts, minimum thresholds, and flags.</div>
                        </div>
                    </div>
                </div>
                <div class="side-card">
                    <h3>Audit System Design</h3>
                    <div class="flow-step">
                        <div class="flow-num">L</div>
                        <div class="flow-desc">Every mutation on user statuses triggers logging to user_status_audit_logs.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">A</div>
                        <div class="flow-desc">Every general administration action creates an entry in admin_audit_logs.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # 5. Customer Support
    html_support = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BharatBasket Customer Support DB-Code Mapping</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>{base_css}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>BharatBasket DB-Code Mapping: Customer Support Module</h1>
                <p>Maps customer inquiries, ticket workflows, customer care responses, and FAQs</p>
            </div>
            <div class="header-right">
                <span class="status-badge">Helpdesk Module</span>
            </div>
        </div>
        <div class="content-grid">
            <div class="editor-wrapper">
                <div class="editor-titlebar">
                    <div class="window-dots">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                    </div>
                    <div class="file-path">backend/routes/support.py</div>
                </div>
                <div class="code-container">
                    <div class="code-line"><span class="line-num">1</span><span class="line-content"><span class="keyword">@support_bp.route</span>(<span class="string">'/messages/&lt;int:id&gt;/reply'</span>, methods=[<span class="string">'POST'</span>])</span></div>
                    <div class="code-line"><span class="line-num">2</span><span class="line-content"><span class="keyword">@admin_required</span></span></div>
                    <div class="code-line"><span class="line-num">3</span><span class="line-content"><span class="keyword">def</span> <span class="func">add_reply</span>(id):</span></div>
                    <div class="code-line"><span class="line-num">4</span><span class="line-content">    # 1. Look up support ticket</span></div>
                    <div class="code-line"><span class="line-num">5</span><span class="line-content">    msg = <span class="class">SupportMessageModel</span>.query.get_or_404(id)</span></div>
                    <div class="code-line"><span class="line-num">6</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">7</span><span class="line-content">    # 2. Append reply to replies table</span></div>
                    <div class="code-line"><span class="line-num">8</span><span class="line-content">    reply = <span class="class">SupportReplyModel</span>(support_id=msg.id, sender=<span class="string">'Admin'</span>, message=text)</span></div>
                    <div class="code-line"><span class="line-num">9</span><span class="line-content">    db.session.add(reply)</span></div>
                    <div class="code-line"><span class="line-num">10</span><span class="line-content">    </span></div>
                    <div class="code-line"><span class="line-num">11</span><span class="line-content">    # 3. Transition ticket status to Responded</span></div>
                    <div class="code-line"><span class="line-num">12</span><span class="line-content">    msg.status = <span class="string">'Responded'</span></span></div>
                    <div class="code-line"><span class="line-num">13</span><span class="line-content">    db.session.commit()</span></div>
                    <div class="code-line"><span class="line-num">14</span><span class="line-content">    <span class="keyword">return</span> jsonify(reply.to_dict())</span></div>
                </div>
            </div>
            <div class="sidebar">
                <div class="side-card">
                    <h3>Mapped Database Tables</h3>
                    <div class="table-list">
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">support_messages</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores initial queries received from customers, including contact information and open/resolved status indicators.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">support_replies</span>
                                <span class="op-badge op-write">Write</span>
                            </div>
                            <div class="table-item-desc">Stores communication history (replies) linked to support messages. Cascade deleted if the main ticket is cleared.</div>
                        </div>
                        <div class="table-item">
                            <div class="table-item-header">
                                <span class="table-badge">faqs</span>
                                <span class="op-badge op-read">Read</span>
                            </div>
                            <div class="table-item-desc">Stores frequently asked questions and answers served on the customer help center.</div>
                        </div>
                    </div>
                </div>
                <div class="side-card">
                    <h3>Workflows</h3>
                    <div class="flow-step">
                        <div class="flow-num">1</div>
                        <div class="flow-desc">Customer submits support form -> row written to support_messages.</div>
                    </div>
                    <div class="flow-step">
                        <div class="flow-num">2</div>
                        <div class="flow-desc">Admin sends reply -> row written to support_replies; parent status updated.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # Replace place holders
    html_user = html_user.replace("{base_css}", base_css)
    html_product = html_product.replace("{base_css}", base_css)
    html_order = html_order.replace("{base_css}", base_css)
    html_admin = html_admin.replace("{base_css}", base_css)
    html_support = html_support.replace("{base_css}", base_css)

    # Write files
    with open("docs/html/user_code_mapping.html", "w") as f:
        f.write(html_user)
    with open("docs/html/product_code_mapping.html", "w") as f:
        f.write(html_product)
    with open("docs/html/order_code_mapping.html", "w") as f:
        f.write(html_order)
    with open("docs/html/admin_code_mapping.html", "w") as f:
        f.write(html_admin)
    with open("docs/html/support_code_mapping.html", "w") as f:
        f.write(html_support)

    print("Successfully generated all HTML files in docs/html!")

if __name__ == "__main__":
    main()
