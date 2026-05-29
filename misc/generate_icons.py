import os
from PIL import Image, ImageDraw

def create_gradient_icon(size):
    # Create an image with an alpha channel (RGBA)
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Scale coordinates based on size
    s = size

    # We will draw a beautiful premium rounded squircle with a gradient
    gradient = Image.new("RGBA", (s, s))
    g_draw = ImageDraw.Draw(gradient)
    
    # Draw linear gradient from top-left (indigo: 79, 70, 229) to bottom-right (pink: 236, 72, 153)
    for y in range(s):
        for x in range(s):
            # Calculate gradient factor
            factor = (x + y) / (2.0 * s)
            r = int(79 + (236 - 79) * factor)
            g = int(70 + (72 - 70) * factor)
            b = int(229 + (153 - 229) * factor)
            gradient.putpixel((x, y), (r, g, b, 255))

    # Mask for rounded squircle
    mask = Image.new("L", (s, s), 0)
    m_draw = ImageDraw.Draw(mask)
    
    # Draw rounded rectangle for mask
    pad = max(1, int(s * 0.08))
    radius = max(2, int(s * 0.25))
    m_draw.rounded_rectangle([pad, pad, s - pad - 1, s - pad - 1], radius=radius, fill=255)

    # Apply mask to gradient
    icon_base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    icon_base.paste(gradient, (0, 0), mask=mask)

    # Draw "Tab Stack" graphics
    t_draw = ImageDraw.Draw(icon_base)
    
    w = s - 2 * pad
    center_y = s // 2
    
    # Proportions based on size
    tab_h = max(3, int(s * 0.16))
    tab_w = max(6, int(s * 0.50))
    gap = max(1, int(s * 0.06))
    
    # Accent bar on the left
    bar_x = pad + max(2, int(s * 0.12))
    bar_y1 = pad + max(3, int(s * 0.15))
    bar_y2 = s - pad - max(3, int(s * 0.15))
    bar_w = max(1, int(s * 0.06))
    
    t_draw.rounded_rectangle([bar_x, bar_y1, bar_x + bar_w, bar_y2], radius=max(1, bar_w//2), fill=(255, 255, 255, 204))
    
    # Horizontal tab elements next to it
    tx = bar_x + bar_w + max(2, int(s * 0.08))
    
    # Tab 1
    ty1 = bar_y1
    t_draw.rounded_rectangle([tx, ty1, tx + tab_w, ty1 + tab_h], radius=max(1, tab_h//3), fill=(255, 255, 255, 255))
    
    # Tab 2
    ty2 = ty1 + tab_h + gap
    if ty2 + tab_h <= bar_y2 + 2:
        t_draw.rounded_rectangle([tx, ty2, tx + tab_w - max(1, int(s*0.05)), ty2 + tab_h], radius=max(1, tab_h//3), fill=(255, 255, 255, 180))
        
    # Tab 3
    ty3 = ty2 + tab_h + gap
    if ty3 + tab_h <= bar_y2 + 4:
        t_draw.rounded_rectangle([tx, ty3, tx + tab_w - max(1, int(s*0.1)), ty3 + tab_h], radius=max(1, tab_h//3), fill=(255, 255, 255, 120))

    return icon_base

if __name__ == "__main__":
    # Ensure directory exists in parent folder (root of the extension)
    os.makedirs("../icons", exist_ok=True)
    for size in [16, 32, 48, 128]:
        img = create_gradient_icon(size)
        img.save(f"../icons/icon{size}.png")
        print(f"Generated icons/icon{size}.png successfully!")
