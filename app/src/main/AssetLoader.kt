package com.nebulastrike.spacefighter.assets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.opengl.GLES20
import android.opengl.GLUtils
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.DataInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.ShortBuffer

/**
 * Universal asset loader for Nebula Strike
 * Loads binary assets optimized for Android
 */
class AssetLoader(private val context: Context) {
    
    companion object {
        private const val TAG = "AssetLoader"
        private const val ASSET_PATH = ""
        private const val MANIFEST_NAME = "asset-manifest.json"
       
        // Binary format constants
        private const val MODEL_MAGIC = 0x4E45424D // "NEBM"
        private const val MODEL_VERSION = 1
    }
    
    private var manifest: JSONObject? = null
    private val textureCache = mutableMapOf<String, Int>()
    private val modelCache = mutableMapOf<String, ModelData>()
    
    data class ModelData(
        val vertexBuffer: FloatBuffer,
        val normalBuffer: FloatBuffer?,
        val texCoordBuffer: FloatBuffer?,
        val indexBuffer: ShortBuffer,
        val vertexCount: Int,
        val indexCount: Int
    )
    
    /**
     * Initialize and load manifest
     */
    suspend fun initialize(): Boolean = withContext(Dispatchers.IO) {
        try {
            val manifestString = context.assets.open(MANIFEST_NAME).bufferedReader().use { it.readText() }
            manifest = JSONObject(manifestString)
            Log.d(TAG, "Asset manifest loaded successfully")
            true
        } catch (e: IOException) {
            Log.e(TAG, "Failed to load asset manifest", e)
            false
        }
    }
    
    /**
     * Load texture as OpenGL texture ID
     */
    suspend fun loadTexture(name: String): Int? = withContext(Dispatchers.IO) {
        textureCache[name]?.let { return@withContext it }
        
        try {
            val config = manifest?.getJSONObject("assets")
                ?.getJSONObject("textures")
                ?.getJSONObject(name) ?: return@withContext null
            
            val path = config.getString("android")
            val width = config.getInt("width")
            val height = config.getInt("height")
            
            // Try ETC2 first, fallback to PNG
            val textureId = loadETC2Texture(path) ?: loadPNGTexture(path, width, height)
            
            if (textureId != null) {
                textureCache[name] = textureId
                Log.d(TAG, "Loaded texture: $name ($width x $height)")
            }
            
            textureId
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load texture: $name", e)
            null
        }
    }
    
    /**
     * Load ETC2 compressed texture
     */
    private fun loadETC2Texture(path: String): Int? {
        return try {
            context.assets.open(path).use { stream ->
                // Parse ETC2 header and upload to GPU
                // This requires platform-specific ETC2 loader
                // For now, return null to trigger PNG fallback
                null
            }
        } catch (e: IOException) {
            null
        }
    }
    
    /**
     * Load PNG texture as fallback
     */
    private fun loadPNGTexture(path: String, width: Int, height: Int): Int? {
        val pngPath = path.replace(".etc2", ".png")
        
        return try {
            context.assets.open(pngPath).use { stream ->
                val bitmap = BitmapFactory.decodeStream(stream)
                    ?: return null
                
                val textureIds = IntArray(1)
                GLES20.glGenTextures(1, textureIds, 0)
                val textureId = textureIds[0]
                
                GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)
                
                // Set texture parameters
                GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR_MIPMAP_LINEAR)
                GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
                GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
                GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
                
                // Upload texture
                GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
                GLES20.glGenerateMipmap(GLES20.GL_TEXTURE_2D)
                
                bitmap.recycle()
                textureId
            }
        } catch (e: IOException) {
            Log.e(TAG, "PNG texture not found: $pngPath")
            null
        }
    }
    
    /**
     * Load 3D model from binary format
     */
    suspend fun loadModel(name: String): ModelData? = withContext(Dispatchers.IO) {
        modelCache[name]?.let { return@withContext it }
        
        try {
            val config = manifest?.getJSONObject("assets")
                ?.getJSONObject("models")
                ?.getJSONObject(name) ?: return@withContext null
            
            val path = config.getString("android")
            
            context.assets.open(path).use { stream ->
                val dis = DataInputStream(stream)
                
                // Read header
                val magic = dis.readInt()
                if (magic != MODEL_MAGIC) {
                    throw IOException("Invalid model format")
                }
                
                val version = dis.readInt()
                val vertexCount = dis.readInt()
                val indexCount = dis.readInt()
                val flags = dis.readUnsignedByte()
                
                val hasNormals = (flags and 0x02) != 0
                val hasUVs = (flags and 0x01) != 0
                
                // Read vertex positions
                val vertexBuffer = ByteBuffer
                    .allocateDirect(vertexCount * 3 * 4)
                    .order(ByteOrder.nativeOrder())
                    .asFloatBuffer()
                
                for (i in 0 until vertexCount * 3) {
                    vertexBuffer.put(dis.readFloat())
                }
                vertexBuffer.position(0)
                
                // Read normals
                val normalBuffer = if (hasNormals) {
                    val buffer = ByteBuffer
                        .allocateDirect(vertexCount * 3 * 4)
                        .order(ByteOrder.nativeOrder())
                        .asFloatBuffer()
                    for (i in 0 until vertexCount * 3) {
                        buffer.put(dis.readFloat())
                    }
                    buffer.position(0)
                    buffer
                } else null
                
                // Read UVs
                val texCoordBuffer = if (hasUVs) {
                    val buffer = ByteBuffer
                        .allocateDirect(vertexCount * 2 * 4)
                        .order(ByteOrder.nativeOrder())
                        .asFloatBuffer()
                    for (i in 0 until vertexCount * 2) {
                        buffer.put(dis.readFloat())
                    }
                    buffer.position(0)
                    buffer
                } else null
                
                // Read indices
                val indexBuffer = ByteBuffer
                    .allocateDirect(indexCount * 2)
                    .order(ByteOrder.nativeOrder())
                    .asShortBuffer()
                
                for (i in 0 until indexCount) {
                    indexBuffer.put(dis.readShort())
                }
                indexBuffer.position(0)
                
                val modelData = ModelData(
                    vertexBuffer = vertexBuffer,
                    normalBuffer = normalBuffer,
                    texCoordBuffer = texCoordBuffer,
                    indexBuffer = indexBuffer,
                    vertexCount = vertexCount,
                    indexCount = indexCount
                )
                
                modelCache[name] = modelData
                Log.d(TAG, "Loaded model: $name ($vertexCount vertices)")
                modelData
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load model: $name", e)
            null
        }
    }
    
    /**
     * Load audio file path
     */
    fun getAudioPath(name: String): String? {
        return try {
            val config = manifest?.getJSONObject("assets")
                ?.getJSONObject("audio")
                ?.getJSONObject(name)
            
            config?.getString("android")
        } catch (e: Exception) {
            Log.e(TAG, "Audio not found: $name")
            null
        }
    }
    
    /**
     * Get level data
     */
    suspend fun loadLevels(): List<LevelData> = withContext(Dispatchers.IO) {
        try {
            val path = manifest?.getJSONObject("assets")
                ?.getJSONObject("data")
                ?.getJSONObject("levels")
                ?.getString("android") ?: return@withContext emptyList()
            
            context.assets.open(path).use { stream ->
                val json = stream.bufferedReader().use { it.readText() }
                val root = JSONObject(json)
                val levelsArray = root.getJSONArray("levels")
                
                val levels = mutableListOf<LevelData>()
                for (i in 0 until levelsArray.length()) {
                    levels.add(parseLevel(levelsArray.getJSONObject(i)))
                }
                levels
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load levels", e)
            emptyList()
        }
    }
    
    private fun parseLevel(json: JSONObject): LevelData {
        return LevelData(
            id = json.getInt("id"),
            name = json.getString("name"),
            asteroidSpawnRate = json.getDouble("asteroidSpawnRate").toFloat(),
            asteroidSpeedMultiplier = json.getDouble("asteroidSpeedMultiplier").toFloat(),
            powerUpFrequency = json.getDouble("powerUpFrequency").toFloat(),
            backgroundTexture = json.optString("backgroundTexture", "nebula-background"),
            musicTrack = json.optString("musicTrack", "background-music"),
            unlockCost = json.optInt("unlockCost", 0)
        )
    }
    
    /**
     * Clear caches to free memory
     */
    fun clearCache() {
        // Delete OpenGL textures
        val textureIds = textureCache.values.toIntArray()
        if (textureIds.isNotEmpty()) {
            GLES20.glDeleteTextures(textureIds.size, textureIds, 0)
        }
        
        textureCache.clear()
        modelCache.clear()
        
        Log.d(TAG, "Asset caches cleared")
    }
    
    data class LevelData(
        val id: Int,
        val name: String,
        val asteroidSpawnRate: Float,
        val asteroidSpeedMultiplier: Float,
        val powerUpFrequency: Float,
        val backgroundTexture: String,
        val musicTrack: String,
        val unlockCost: Int
    )
}
