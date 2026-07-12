with open('src/pages/ProductDetails.jsx', 'r') as f:
    content = f.read()

target = """        ) : (
            {/* LEFT COLUMN: Vertical Image Thumbnails (15% / 2-columns on desktop) */}"""

replacement = """        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT COLUMN: Vertical Image Thumbnails (15% / 2-columns on desktop) */}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/ProductDetails.jsx', 'w') as f:
        f.write(content)
    print("Fixed syntax")
else:
    print("Target not found")
