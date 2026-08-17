from PIL import Image, ImageEnhance
import os

img = Image.open(r'C:\Users\Pragadeesh S\.gemini\antigravity\brain\aa9f55f3-5bb6-4479-b345-8b5b3332cfbe\media__1786969866919.png')
w, h = img.size

# Slice into 4 vertical sections
slice_h = h // 4
for i in range(4):
    box = (0, i * slice_h, w, (i + 1) * slice_h)
    cropped = img.crop(box)
    resized = cropped.resize((w * 3, slice_h * 3), Image.Resampling.LANCZOS)
    enh = ImageEnhance.Contrast(resized).enhance(2.0)
    enh.save(f'C:\\tmp\\slice_{i}.png')

print("Cropped 4 enlarged slices to C:\\tmp\\slice_0.png .. slice_3.png")
