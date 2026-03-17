#!/usr/bin/env python3
"""
Nebula Strike UI Asset Generator
Creates all UI icons and buttons programmatically using Pillow
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import math


class UIAssetGenerator:
    def __init__(self, output_dir="shared-assets/raw/textures/ui"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Color scheme - cyberpunk neon
        self.colors = {
            'bg_dark': (10, 10, 26),
            'bg_panel': (26, 26, 62),
            'cyan': (0, 212, 255),
            'cyan_glow': (0, 255, 255),
            'orange': (255, 102, 0),
            'orange_glow': (255, 170, 0),
            'gold': (255, 215, 0),
            'red': (255, 68, 68),
            'blue': (68, 68, 255),
            'white': (255, 255, 255),
            'gray': (170, 170, 170)
        }
    
    def save(self, image, filename):
        """Save with proper settings for game use"""
        # Save as PNG with transparency
        path = os.path.join(self.output_dir, filename)
        image.save(path, 'PNG', optimize=True)
        print(f"✅ Generated: {filename} ({image.width}x{image.height})")
        return path
    
    def create_gradient(self, size, color1, color2, direction='vertical'):
        """Create smooth gradient background"""
        width, height = size
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        for i in range(height if direction == 'vertical' else width):
            ratio = i / (height if direction == 'vertical' else width)
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            
            if direction == 'vertical':
                draw.line([(0, i), (width, i)], fill=(r, g, b, 255))
            else:
                draw.line([(i, 0), (i, height)], fill=(r, g, b, 255))
        
        return image
    
    def add_glow(self, image, color, radius=20, intensity=0.5):
        """Add outer glow effect"""
        # Create glow layer
        glow = Image.new('RGBA', image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(glow)
        
        # Draw expanded shape for glow
        alpha = int(255 * intensity)
        glow_color = (*color, alpha)
        
        # Blur the glow
        glow = glow.filter(ImageFilter.GaussianBlur(radius))
        
        # Composite
        return Image.alpha_composite(glow, image)
    
    def generate_logo(self):
        """Generate game logo - stylized 'NS' with nebula effect"""
        size = (400, 200)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Background nebula effect
        for i in range(50):
            x = math.sin(i * 0.5) * 150 + 200
            y = math.cos(i * 0.3) * 80 + 100
            r = 30 + i * 2
            alpha = 20 - i // 3
            color = self.colors['cyan'] if i % 2 == 0 else self.colors['purple'] if 'purple' in self.colors else (128, 0, 128)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(*color, max(0, alpha)))
        
        # Main text "NEBULA"
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        except:
            font_large = ImageFont.load_default()
            font_small = font_large
        
        # Draw "NEBULA" with glow
        text = "NEBULA"
        bbox = draw.textbbox((0, 0), text, font=font_large)
        text_width = bbox[2] - bbox[0]
        x = (400 - text_width) // 2
        y = 40
        
        # Glow layers
        for offset in range(15, 0, -3):
            alpha = 30
            glow_color = (*self.colors['cyan'], alpha)
            draw.text((x, y), text, font=font_large, fill=glow_color)
        
        # Main text
        draw.text((x, y), text, font=font_large, fill=self.colors['cyan'])
        
        # Draw "STRIKE" below
        text2 = "STRIKE"
        bbox2 = draw.textbbox((0, 0), text2, font=font_small)
        text2_width = bbox2[2] - bbox2[0]
        x2 = (400 - text2_width) // 2
        y2 = 110
        
        # Orange glow for STRIKE
        for offset in range(10, 0, -2):
            alpha = 40
            glow_color = (*self.colors['orange'], alpha)
            draw.text((x2, y), text2, font=font_small, fill=glow_color)
        
        draw.text((x2, y2), text2, font=font_small, fill=self.colors['orange'])
        
        # Decorative line
        draw.line([(50, 160), (350, 160)], fill=self.colors['cyan'], width=2)
        draw.line([(100, 165), (300, 165)], fill=self.colors['orange'], width=1)
        
        return self.save(image, "logo.png")
    
    def generate_button_play(self):
        """Generate play button with triangle icon"""
        size = (200, 80)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Button background with gradient
        bg = self.create_gradient(size, self.colors['bg_panel'], self.colors['bg_dark'])
        image.paste(bg, (0, 0))
        
        # Border with glow
        border_color = self.colors['cyan']
        draw.rounded_rectangle([2, 2, 198, 78], radius=12, outline=border_color, width=3)
        
        # Inner glow
        for i in range(5):
            alpha = 50 - i * 10
            draw.rounded_rectangle([4+i, 4+i, 196-i, 76-i], radius=10, outline=(*self.colors['cyan'], alpha), width=1)
        
        # Play triangle
        triangle = [(40, 25), (40, 55), (70, 40)]
        draw.polygon(triangle, fill=self.colors['cyan'])
        
        # Text
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        except:
            font = ImageFont.load_default()
        
        draw.text((90, 26), "PLAY", font=font, fill=self.colors['white'])
        
        return self.save(image, "button-play.png")
    
    def generate_button_shop(self):
        """Generate shop button with cart icon"""
        size = (200, 80)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Background
        bg = self.create_gradient(size, self.colors['bg_panel'], self.colors['bg_dark'])
        image.paste(bg, (0, 0))
        
        # Gold border for shop
        border_color = self.colors['gold']
        draw.rounded_rectangle([2, 2, 198, 78], radius=12, outline=border_color, width=3)
        
        # Cart icon (simple representation)
        # Cart body
        draw.rectangle([35, 35, 65, 50], outline=self.colors['gold'], width=2)
        # Cart handle
        draw.line([(30, 35), (35, 35)], fill=self.colors['gold'], width=2)
        # Wheels
        draw.ellipse([38, 52, 45, 59], outline=self.colors['gold'], width=2)
        draw.ellipse([55, 52, 62, 59], outline=self.colors['gold'], width=2)
        
        # Text
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        except:
            font = ImageFont.load_default()
        
        draw.text((85, 26), "SHOP", font=font, fill=self.colors['gold'])
        
        return self.save(image, "button-shop.png")
    
    def generate_icon_coin(self):
        """Generate coin icon with gold circle and $ symbol"""
        size = (64, 64)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        center = (32, 32)
        radius = 28
        
        # Outer glow
        for r in range(radius + 10, radius, -2):
            alpha = 30
            draw.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], 
                        fill=(*self.colors['gold'], alpha))
        
        # Main coin circle with gradient effect
        draw.ellipse([center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius], 
                    fill=self.colors['gold'])
        
        # Inner highlight
        highlight_radius = 22
        draw.ellipse([center[0]-highlight_radius, center[1]-highlight_radius, 
                     center[0]+highlight_radius, center[1]+highlight_radius], 
                    fill=(255, 235, 150))
        
        # $ symbol
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), "$", font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (64 - text_width) // 2 - 2
        y = (64 - text_height) // 2 - 5
        
        draw.text((x, y), "$", font=font, fill=(180, 140, 0))
        
        return self.save(image, "icon-coin.png")
    
    def generate_icon_heart(self):
        """Generate heart icon for lives"""
        size = (64, 64)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Heart shape using bezier-like curves (approximated with polygons)
        center_x, center_y = 32, 32
        scale = 25
        
        # Generate heart points
        points = []
        for i in range(100):
            t = i / 100.0 * 2 * math.pi
            # Heart equation
            x = 16 * math.sin(t) ** 3
            y = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))
            
            points.append((center_x + x * scale / 16, center_y + y * scale / 16))
        
        # Glow
        for offset in range(8, 0, -2):
            alpha = 40
            glow_points = [(p[0], p[1]+offset) for p in points]
            draw.polygon(glow_points, fill=(*self.colors['red'], alpha))
        
        # Main heart
        draw.polygon(points, fill=self.colors['red'])
        
        # Highlight
        highlight_points = [(p[0], p[1]-3) for p in points[:25]]
        draw.polygon(highlight_points, fill=(255, 150, 150))
        
        return self.save(image, "icon-heart.png")
    
    def generate_icon_shield(self):
        """Generate shield icon with protection symbol"""
        size = (64, 64)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        center = (32, 32)
        
        # Shield shape (pointing down)
        shield_points = [
            (32, 8),   # top
            (52, 18),  # right top
            (52, 35),  # right middle
            (32, 56),  # bottom point
            (12, 35),  # left middle
            (12, 18),  # left top
        ]
        
        # Glow
        for offset in range(6, 0, -1):
            alpha = 30
            glow_points = [(p[0], p[1]+offset) for p in shield_points]
            draw.polygon(glow_points, fill=(*self.colors['blue'], alpha))
        
        # Main shield
        draw.polygon(shield_points, fill=self.colors['blue'], outline=self.colors['cyan'], width=2)
        
        # Inner shield detail
        inner_points = [
            (32, 15),
            (45, 22),
            (45, 33),
            (32, 48),
            (19, 33),
            (19, 22),
        ]
        draw.polygon(inner_points, fill=(100, 100, 255), outline=self.colors['cyan'], width=1)
        
        # Plus symbol in center
        draw.rectangle([28, 24, 36, 40], fill=self.colors['white'])
        draw.rectangle([24, 28, 40, 32], fill=self.colors['white'])
        
        return self.save(image, "icon-shield.png")
    
    def generate_icon_laser(self):
        """Generate laser/energy icon with lightning bolt"""
        size = (64, 64)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Lightning bolt shape
        bolt_points = [
            (35, 8),   # top
            (25, 28),  # upper left
            (32, 28),  # upper right indent
            (22, 56),  # bottom
            (38, 32),  # lower right
            (30, 32),  # lower left indent
        ]
        
        # Electric glow
        for offset in range(8, 0, -2):
            alpha = 50 - offset * 5
            glow_points = [(p[0]+offset, p[1]) for p in bolt_points]
            draw.polygon(glow_points, fill=(*self.colors['cyan'], alpha))
        
        # Main bolt
        draw.polygon(bolt_points, fill=self.colors['cyan'], outline=self.colors['white'], width=2)
        
        # Energy rings around
        center = (32, 32)
        for r in [20, 26]:
            alpha = 100
            draw.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], 
                        outline=(*self.colors['cyan'], alpha), width=1)
        
        return self.save(image, "icon-laser.png")
    
    def generate_all(self):
        """Generate all UI assets"""
        print("🎨 Generating Nebula Strike UI Assets...\n")
        
        self.generate_logo()
        self.generate_button_play()
        self.generate_button_shop()
        self.generate_icon_coin()
        self.generate_icon_heart()
        self.generate_icon_shield()
        self.generate_icon_laser()
        
        print(f"\n✅ All assets saved to: {self.output_dir}")
        print("📝 Files generated:")
        for f in os.listdir(self.output_dir):
            size = os.path.getsize(os.path.join(self.output_dir, f))
            print(f"   • {f} ({size/1024:.1f} KB)")


def main():
    generator = UIAssetGenerator()
    generator.generate_all()


if __name__ == "__main__":
    main()
