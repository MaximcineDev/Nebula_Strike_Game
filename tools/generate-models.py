#!/usr/bin/env python3
"""
Nebula Strike 3D Model Generator
Creates procedural spaceship and asteroid models
"""

import os
import json
import math
import random


class ModelGenerator:
    def __init__(self, output_dir="shared-assets/raw/models"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def save_json(self, filename, data):
        """Save model as JSON"""
        path = os.path.join(self.output_dir, filename)
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ {filename} ({len(data['vertices'])//3} vertices)")
        return path
    
    def save_binary(self, filename, data):
        """Save model as binary (for Android)"""
        import struct
        
        path = os.path.join(self.output_dir, filename)
        
        with open(path, 'wb') as f:
            # Header: magic + version + counts + flags
            f.write(b'NEBM')  # Magic
            f.write(struct.pack('<I', 1))  # Version
            f.write(struct.pack('<I', len(data['vertices']) // 3))  # Vertex count
            f.write(struct.pack('<I', len(data['faces'])))  # Triangle count
            f.write(struct.pack('<B', 0x03))  # Flags: has normals + has UVs
            
            # Vertices
            for v in data['vertices']:
                f.write(struct.pack('<f', v))
            
            # Normals
            for n in data['normals']:
                f.write(struct.pack('<f', n))
            
            # UVs
            for uv in data['uvs']:
                f.write(struct.pack('<f', uv))
            
            # Indices
            for face in data['faces']:
                for idx in face:
                    f.write(struct.pack('<H', idx))
        
        print(f"✅ {filename} (binary)")
        return path
    
    def generate_spaceship(self):
        """Generate detailed spaceship model"""
        vertices = []
        normals = []
        uvs = []
        faces = []
        
        # Fuselage (main body) - elongated octagonal prism
        body_length = 1.2
        body_width = 0.3
        body_height = 0.15
        
        # Nose cone
        nose_tip = [0, body_length, 0]
        vertices.extend(nose_tip)
        normals.extend([0, 1, 0])
        uvs.extend([0.5, 1.0])
        
        # Body rings
        rings = 8
        ring_verts = []
        
        for i in range(rings):
            t = i / (rings - 1)  # 0 to 1
            y = body_length - t * body_length * 2  # Front to back
            
            # Tapering width
            width = body_width * (1 - t * 0.3)
            height = body_height * (1 - t * 0.2)
            
            ring = []
            segments = 8
            
            for j in range(segments):
                angle = (j / segments) * 2 * math.pi
                x = math.cos(angle) * width
                z = math.sin(angle) * height
                
                # Flatten bottom slightly
                if z < 0:
                    z *= 0.5
                
                ring.append([x, y, z])
                
                # Normal
                nx = math.cos(angle)
                nz = math.sin(angle) * (height / width)  # Scale for elliptical normal
                ny = 0.1  # Slight upward tilt
                length = math.sqrt(nx*nx + ny*ny + nz*nz)
                normals.extend([nx/length, ny/length, nz/length])
                
                # UV
                u = j / segments
                v = 1 - t
                uvs.extend([u, v])
                
                idx = len(vertices) // 3
                vertices.extend([x, y, z])
                ring.append(idx)
            
            ring_verts.append(ring)
        
        # Create faces between rings
        for i in range(len(ring_verts) - 1):
            curr_ring = ring_verts[i]
            next_ring = ring_verts[i + 1]
            
            for j in range(len(curr_ring)):
                j_next = (j + 1) % len(curr_ring)
                
                # Two triangles per quad
                faces.append([curr_ring[j], next_ring[j], curr_ring[j_next]])
                faces.append([curr_ring[j_next], next_ring[j], next_ring[j_next]])
        
        # Nose to first ring
        first_ring = ring_verts[0]
        for j in range(len(first_ring)):
            j_next = (j + 1) % len(first_ring)
            faces.append([0, first_ring[j_next], first_ring[j]])
        
        # Wings
        wing_span = 0.8
        wing_chord = 0.6
        wing_thickness = 0.05
        
        wing_verts_start = len(vertices) // 3
        
        # Wing profile (swept back)
        wing_points = [
            [wing_span, 0.2, 0],           # tip
            [wing_span * 0.7, -0.1, 0.02],  # mid
            [body_width, -0.3, 0.05],       # root front
            [body_width, -0.5, 0.02],       # root back
        ]
        
        # Create wing thickness
        for point in wing_points:
            # Top surface
            vertices.extend([point[0], point[1], point[2] + wing_thickness])
            normals.extend([0, 0, 1])
            uvs.extend([0.5, 0.5])
            
            # Bottom surface
            vertices.extend([point[0], point[1], point[2] - wing_thickness])
            normals.extend([0, 0, -1])
            uvs.extend([0.5, 0.5])
        
        # Wing faces (simplified)
        for i in range(len(wing_points) - 1):
            # Top
            faces.append([
                wing_verts_start + i * 2,
                wing_verts_start + (i + 1) * 2,
                wing_verts_start + i * 2 + 1
            ])
        
        # Mirror for left wing (we'll just use same geometry scaled negatively in X)
        
        # Engine nozzles
        engine_y = -0.6
        engine_z = 0.1
        
        for side in [-1, 1]:
            center_idx = len(vertices) // 3
            vertices.extend([side * 0.15, engine_y, engine_z])
            normals.extend([0, -1, 0])
            uvs.extend([0.5, 0.5])
            
            # Engine ring
            ring_indices = []
            for j in range(8):
                angle = (j / 8) * 2 * math.pi
                r = 0.08
                x = side * 0.15 + math.cos(angle) * r
                y = engine_y
                z = engine_z + math.sin(angle) * r
                
                vertices.extend([x, y, z])
                normals.extend([0, -1, 0])
                uvs.extend([0.5 + math.cos(angle)*0.5, 0.5 + math.sin(angle)*0.5])
                ring_indices.append(len(vertices) // 3 - 1)
            
            # Fan out from center
            for j in range(8):
                j_next = (j + 1) % 8
                faces.append([center_idx, ring_indices[j], ring_indices[j_next]])
        
        model_data = {
            "metadata": {
                "version": 1.0,
                "type": "Geometry",
                "generator": "NebulaStrikeModelGen",
                "name": "spaceship"
            },
            "vertices": vertices,
            "normals": normals,
            "uvs": uvs,
            "faces": faces
        }
        
        # Save both formats
        self.save_json("spaceship.json", model_data)
        self.save_binary("spaceship.bin", model_data)
        
        return model_data
    
    def generate_asteroid(self, size="medium", seed=12345):
        """Generate procedural asteroid with irregular shape"""
        rng = random.Random(seed)
        
        vertices = []
        normals = []
        uvs = []
        faces = []
        
        # Icosphere base with displacement
        # Start with octahedron
        r = 0.5  # Base radius
        
        # Octahedron vertices
        base_verts = [
            [0, r, 0],   # top
            [0, -r, 0],  # bottom
            [r, 0, 0],   # right
            [-r, 0, 0],  # left
            [0, 0, r],   # front
            [0, 0, -r],  # back
        ]
        
        # Displace vertices with noise
        displaced = []
        for v in base_verts:
            # Add random displacement
            displacement = 0.3
            new_v = [
                v[0] * (1 + rng.uniform(-displacement, displacement)),
                v[1] * (1 + rng.uniform(-displacement, displacement)),
                v[2] * (1 + rng.uniform(-displacement, displacement))
            ]
            displaced.append(new_v)
            
            # Calculate normal (simplified, just normalized position)
            length = math.sqrt(sum(x*x for x in new_v))
            normals.extend([x/length for x in new_v])
            
            uvs.extend([0.5, 0.5])  # Simple UV mapping
        
        # Subdivide and displace more for detail
        # (Simplified: just use octahedron with displaced vertices)
        
        vertices = [coord for v in displaced for coord in v]
        
        # Octahedron faces
        faces = [
            [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],  # top cap
            [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]   # bottom cap
        ]
        
        # Scale by size
        scales = {"small": 0.6, "medium": 1.0, "large": 1.4}
        scale = scales.get(size, 1.0)
        vertices = [v * scale for v in vertices]
        
        model_data = {
            "metadata": {
                "version": 1.0,
                "type": "Geometry",
                "generator": "NebulaStrikeModelGen",
                "name": f"asteroid-{size}",
                "seed": seed
            },
            "vertices": vertices,
            "normals": normals,
            "uvs": uvs,
            "faces": faces
        }
        
        self.save_json(f"asteroid-{size}.json", model_data)
        self.save_binary(f"asteroid-{size}.bin", model_data)
        
        return model_data
    
    def generate_all(self):
        """Generate all 3D models"""
        print("🎲 Generating 3D Models...\n")
        
        self.generate_spaceship()
        self.generate_asteroid("small", seed=12345)
        self.generate_asteroid("medium", seed=67890)
        self.generate_asteroid("large", seed=11111)
        
        print(f"\n✅ All models saved to: {self.output_dir}")


if __name__ == "__main__":
    gen = ModelGenerator()
    gen.generate_all()
