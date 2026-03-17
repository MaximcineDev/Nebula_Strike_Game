#!/usr/bin/env python3
"""
Nebula Strike Game Texture Generator
Creates all in-game textures: spaceship, asteroids, particles, background
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops


class GameTextureGenerator:
    def __init__(self, output_dir="shared-assets/raw/textures/game"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.rng = random.Random(42)  # Reproducible
    
    def save(self, image, filename):
        path = os.path.join(self.output_dir, filename)
        image.save(path, 'PNG', optimize=True)
        print(f"✅ {filename} ({image.width}x{image.height})")
        return path
    
    def generate_noise(self, size, scale=1.0):
        """Generate Perlin-like noise texture"""
        width, height = size
        image = Image.new('L', size)
        pixels = image.load()
        
        for y in range(height):
            for x in range(width):
                # Simple layered noise
                value = 0
                freq = 0.01 * scale
                amp = 1.0
                
                for octave in range(4):
                    nx = x * freq
                    ny = y * freq
                    # Simple sine-based noise
                    v = math.sin(nx) * math.cos(ny) + math.sin(nx * 2.3 + ny * 1.7)
                    value += v * amp
                    freq *= 2
                    amp *= 0.5
                
                # Normalize to 0-255
                normalized = int((value + 2) / 4 * 255)
                pixels[x, y] = max(0, min(255, normalized))
        
        return image
    
    def generate_spaceship_diffuse(self):
        """Generate spaceship texture with metallic panels"""
        size = (512, 512)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Base dark metallic
        draw.rectangle([0, 0, 511, 511], fill=(20, 30, 40, 255))
        
        # Add panel lines
        for i in range(8):
            y = i * 64
            draw.line([(0, y), (511, y)], fill=(40, 60, 80, 255), width=2)
        
        for i in range(8):
            x = i * 64
            draw.line([(x, 0), (x, 511)], fill=(40, 60, 80, 255), width=2)
        
        # Central glowing stripe (cyan)
        for i in range(20):
            alpha = 255 - i * 10
            draw.line([(246 + i, 0), (246 + i, 511)], 
                     fill=(0, 212, 255, max(0, alpha)), width=1)
        
        # Engine glow area (orange)
        draw.ellipse([150, 400, 362, 511], fill=(255, 102, 0, 100))
        draw.ellipse([200, 420, 312, 511], fill=(255, 170, 0, 150))
        
        # Add noise for metallic texture
        noise = self.generate_noise(size, 2.0)
        noise_rgb = Image.merge('RGBA', [noise, noise, noise, Image.new('L', size, 50)])
        image = ImageChops.screen(image, noise_rgb)
        
        return self.save(image, "spaceship-diffuse.png")
    
    def generate_spaceship_normal(self):
        """Generate normal map for spaceship"""
        size = (512, 512)
        image = Image.new('RGBA', size, (128, 128, 255, 255))  # Flat normal
        
        draw = ImageDraw.Draw(image)
        
        # Panel indentations (darker blue = pointing in)
        for i in range(8):
            y = i * 64
            draw.line([(0, y), (511, y)], fill=(100, 100, 200, 255), width=3)
        
        for i in range(8):
            x = i * 64
            draw.line([(x, 0), (x, 511)], fill=(100, 100, 200, 255), width=3)
        
        # Central ridge (purple = pointing out)
        for i in range(30):
            intensity = 150 + i * 2
            draw.line([(240 + i, 0), (240 + i, 511)], 
                     fill=(intensity, 100, 200, 255), width=1)
        
        # Smooth with slight blur
        image = image.filter(ImageFilter.GaussianBlur(1))
        
        return self.save(image, "spaceship-normal.png")
    
    def generate_asteroid_diffuse(self):
        """Generate rocky asteroid texture"""
        size = (256, 256)
        
        # Base brown/grey rock
        base = Image.new('RGB', size, (100, 90, 80))
        
        # Generate noise for rock texture
        noise1 = self.generate_noise(size, 3.0)
        noise2 = self.generate_noise(size, 6.0)
        
        # Combine noises
        rock = Image.new('RGB', size)
        pixels = rock.load()
        n1_pixels = noise1.load()
        n2_pixels = noise2.load()
        
        for y in range(size[1]):
            for x in range(size[0]):
                n = (n1_pixels[x, y] + n2_pixels[x, y]) // 2
                # Brown-grey rock color
                r = min(255, 80 + n // 2)
                g = min(255, 70 + n // 2)
                b = min(255, 60 + n // 2)
                pixels[x, y] = (r, g, b)
        
        # Add craters
        draw = ImageDraw.Draw(rock)
        for _ in range(15):
            x = self.rng.randint(0, 255)
            y = self.rng.randint(0, 255)
            r = self.rng.randint(5, 25)
            # Darker center, lighter rim
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(60, 50, 40))
            draw.ellipse([x-r+2, y-r+2, x+r-2, y+r-2], fill=(80, 70, 60))
        
        # Convert to RGBA
        rock_rgba = rock.convert('RGBA')
        
        return self.save(rock_rgba, "asteroid-diffuse.png")
    
    def generate_nebula_background(self):
        """Generate scrolling nebula background"""
        size = (1024, 2048)  # Tall for scrolling
        image = Image.new('RGBA', size, (5, 5, 15, 255))
        draw = ImageDraw.Draw(image)
        
        # Layer 1: Large purple nebula clouds
        for i in range(20):
            x = self.rng.randint(0, 1024)
            y = self.rng.randint(0, 2048)
            r = self.rng.randint(100, 400)
            alpha = self.rng.randint(20, 60)
            color = (80, 0, 120, alpha)  # Purple
            draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
        
        # Layer 2: Medium teal nebula
        for i in range(30):
            x = self.rng.randint(0, 1024)
            y = self.rng.randint(0, 2048)
            r = self.rng.randint(50, 200)
            alpha = self.rng.randint(30, 80)
            color = (0, 100, 120, alpha)  # Teal
            draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
        
        # Layer 3: Small blue highlights
        for i in range(50):
            x = self.rng.randint(0, 1024)
            y = self.rng.randint(0, 2048)
            r = self.rng.randint(20, 80)
            alpha = self.rng.randint(40, 100)
            color = (0, 150, 200, alpha)  # Cyan
            draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
        
        # Add stars
        for i in range(200):
            x = self.rng.randint(0, 1023)
            y = self.rng.randint(0, 2047)
            brightness = self.rng.randint(150, 255)
            size = self.rng.choice([1, 1, 1, 2, 2, 3])
            draw.ellipse([x, y, x+size, y+size], 
                        fill=(brightness, brightness, brightness + 20, 255))
        
        # Blur slightly for softness
        image = image.filter(ImageFilter.GaussianBlur(2))
        
        return self.save(image, "nebula-background.png")
    
    def generate_particle_fire(self):
        """Generate fire/explosion particle texture"""
        size = (128, 128)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        center = (64, 64)
        
        # Radial gradient from white-hot center to transparent
        for r in range(60, 0, -1):
            # Color temperature: white -> yellow -> orange -> red -> transparent
            ratio = r / 60
            if ratio > 0.8:
                color = (255, 255, 255, 255)  # White hot
            elif ratio > 0.6:
                color = (255, 255, 200, 255)  # Yellow
            elif ratio > 0.4:
                color = (255, 200, 100, 255)  # Orange
            elif ratio > 0.2:
                color = (255, 100, 50, 200)   # Red-orange
            else:
                alpha = int(255 * (ratio / 0.2))
                color = (200, 50, 0, alpha)   # Red fading
            
            draw.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], 
                        fill=color)
        
        # Add noise for flame texture
        noise = self.generate_noise(size, 10)
        noise_rgb = Image.merge('RGBA', [
            noise, noise, noise, 
            Image.new('L', size, 100)
        ])
        image = ImageChops.multiply(image, noise_rgb)
        
        return self.save(image, "particle-fire.png")
    
    def generate_particle_spark(self):
        """Generate electric spark particle texture"""
        size = (64, 64)
        image = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        center = (32, 32)
        
        # Electric blue-white core
        for r in range(30, 0, -1):
            ratio = r / 30
            if ratio > 0.7:
                color = (255, 255, 255, 255)  # White core
            elif ratio > 0.4:
                color = (200, 240, 255, 255)  # Light blue
            else:
                alpha = int(255 * (ratio / 0.4))
                color = (100, 200, 255, alpha)  # Cyan fading
        
            draw.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], 
                        fill=color)
        
        # Add spark rays
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            x1 = center[0] + math.cos(rad) * 5
            y1 = center[1] + math.sin(rad) * 5
            x2 = center[0] + math.cos(rad) * 28
            y2 = center[1] + math.sin(rad) * 28
            draw.line([(x1, y1), (x2, y2)], fill=(200, 240, 255, 200), width=2)
        
        # Glow
        image = image.filter(ImageFilter.GaussianBlur(1))
        
        return self.save(image, "particle-spark.png")
    
    def generate_all(self):
        """Generate all game textures"""
        print("🎮 Generating Game Textures...\n")
        
        self.generate_spaceship_diffuse()
        self.generate_spaceship_normal()
        self.generate_asteroid_diffuse()
        self.generate_nebula_background()
        self.generate_particle_fire()
        self.generate_particle_spark()
        
        print(f"\n✅ All game textures saved to: {self.output_dir}")


if __name__ == "__main__":
    gen = GameTextureGenerator()
    gen.generate_all()
