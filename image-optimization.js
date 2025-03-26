const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source directory with original images
const sourceDir = 'src/assets/images';
// Destination directory for optimized images
const outputDir = 'src/assets/optimized-images';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Optimize all images in the source directory
const processImages = async () => {
  try {
    const files = fs.readdirSync(sourceDir);
    
    console.log(`Found ${files.length} files to process...`);
    
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const outputPath = path.join(outputDir, file);
      
      // Skip non-image files
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) {
        console.log(`Skipping non-image file: ${file}`);
        continue;
      }
      
      console.log(`Processing: ${file}`);
      
      try {
        // Use sharp to resize and optimize the image
        await sharp(filePath)
          .resize({
            width: 1200,       // Max width
            height: 1200,      // Max height
            fit: 'inside',     // Keep aspect ratio
            withoutEnlargement: true  // Don't enlarge small images
          })
          .webp({ quality: 80 })  // Convert to WebP with 80% quality
          .toFile(outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
        
        console.log(`Optimized: ${file} -> ${outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
    
    console.log('Image optimization complete!');
  } catch (err) {
    console.error('Error during image optimization:', err);
  }
};

processImages();