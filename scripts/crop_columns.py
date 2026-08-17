from PIL import Image, ImageEnhance, ImageFilter
import os

img_path = r'C:\Users\Pragadeesh S\.gemini\antigravity\brain\aa9f55f3-5bb6-4479-b345-8b5b3332cfbe\media__1786954853767.png'
img = Image.open(img_path).convert('L')
w, h = img.size

# Enhancing image
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(2.5)

cols = [
    ('vehicle_no', 0, 60),
    ('card_no', 60, 95),
    ('driver_name', 95, 175),
    ('driver_no', 175, 215),
    ('incharge', 215, 260),
    ('ton', 260, 299)
]

for name, x1, x2 in cols:
    crop = img.crop((x1, 0, x2, h))
    crop_large = crop.resize(((x2 - x1) * 4, h * 4), Image.Resampling.LANCZOS)
    crop_large.save(f'c:\\Users\\Pragadeesh S\\Desktop\\advance\\col_{name}.png')

print("Created enlarged column images.")
