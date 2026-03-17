#!/bin/bash
# setup-shared-assets.sh

mkdir -p shared-assets/{raw/{textures/{ui,game},audio,models,data/{levels,strings}},processed/{android/{textures,audio,models,data},web/{textures,audio,models,data}}}

# Create placeholder texture files
touch shared-assets/raw/textures/ui/logo.png
touch shared-assets/raw/textures/ui/button-play.png
touch shared-assets/raw/textures/ui/button-shop.png
touch shared-assets/raw/textures/ui/icon-coin.png
touch shared-assets/raw/textures/ui/icon-heart.png
touch shared-assets/raw/textures/ui/icon-shield.png
touch shared-assets/raw/textures/ui/icon-laser.png

touch shared-assets/raw/textures/game/spaceship-diffuse.png
touch shared-assets/raw/textures/game/spaceship-normal.png
touch shared-assets/raw/textures/game/asteroid-diffuse.png
touch shared-assets/raw/textures/game/nebula-background.png
touch shared-assets/raw/textures/game/particle-fire.png
touch shared-assets/raw/textures/game/particle-spark.png

# Create placeholder audio files
touch shared-assets/raw/audio/laser-shoot.wav
touch shared-assets/raw/audio/explosion.wav
touch shared-assets/raw/audio/powerup.wav
touch shared-assets/raw/audio/game-over.wav
touch shared-assets/raw/audio/background-music.wav

# Create placeholder model files
touch shared-assets/raw/models/spaceship.blend
touch shared-assets/raw/models/asteroid.blend

# Create level data files
for i in {1..9}; do
    echo "{
  \"id\": $i,
  \"name\": \"Level $i\",
  \"asteroidSpawnRate\": ${i}00,
  \"asteroidSpeedMultiplier\": 1.$i,
  \"powerUpFrequency\": 0.$(($i * 2)),
  \"backgroundTexture\": \"nebula-background\",
  \"musicTrack\": \"background-music\",
  \"unlockCost\": $((i > 3 ? (i-3) * 500 : 0))
}" > shared-assets/raw/data/levels/level${i}.json
done

# Create localization files
for lang in en es fr de ja zh; do
    echo "{
  \"app_name\": \"Nebula Strike\",
  \"play\": \"Play\",
  \"shop\": \"Shop\",
  \"settings\": \"Settings\",
  \"game_over\": \"Game Over\",
  \"score\": \"Score\",
  \"high_score\": \"High Score\",
  \"coins\": \"Coins\",
  \"level\": \"Level\",
  \"shield\": \"Shield\",
  \"laser\": \"Laser Upgrade\"
}" > shared-assets/raw/data/strings/${lang}.json
done

echo "✅ Directory structure created!"
