from PIL import Image

# Open the architecture PNG with transparency (RGBA)
img = Image.open('medassist_architecture.png').convert('RGBA')

# Define A3 Landscape dimensions at 300 DPI
A4_W, A4_H = 4960, 3508

# Resize image to fit nicely within the A4 page leaving a small margin (scales UP or DOWN)
ratio = min((A4_W - 100) / img.width, (A4_H - 100) / img.height)
new_size = (int(img.width * ratio), int(img.height * ratio))
img = img.resize(new_size, Image.Resampling.LANCZOS)

# Create a blank white A4 canvas (RGBA)
canvas = Image.new('RGBA', (A4_W, A4_H), 'white')

# Paste the resized image into the center of the A4 canvas using img as mask
offset_x = (A4_W - img.width) // 2
offset_y = (A4_H - img.height) // 2
canvas.paste(img, (offset_x, offset_y), img)

# Convert back to RGB for saving as PDF
canvas = canvas.convert('RGB')

# Save the canvas as a 1-page PDF
canvas.save('medassist_architecture_A4.pdf', resolution=300.0)
print("Successfully generated medassist_architecture_A4.pdf")
