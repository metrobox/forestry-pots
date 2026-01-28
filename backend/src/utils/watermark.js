const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const generateWatermarkText = (user, company, productName, downloadId) => {
  const timestamp = new Date().toISOString();
  return {
    main: `${company} - ${user}`,
    footer: `Downloaded by: ${user} (${company}) | Product: ${productName} | ${timestamp} | ID: ${downloadId}`,
    downloadId
  };
};

const watermarkPDF = async (inputPath, outputPath, watermarkInfo) => {
  try {
    const existingPdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const mainText = watermarkInfo.main;
    const footerText = watermarkInfo.footer;

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      page.drawText(mainText, {
        x: width / 2 - (mainText.length * 6),
        y: height / 2,
        size: 48,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3,
        rotate: { angle: 45, type: 'degrees' },
      });

      page.drawText(footerText, {
        x: 30,
        y: 20,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    
    return { success: true, path: outputPath };
  } catch (error) {
    console.error('PDF watermarking error:', error);
    throw error;
  }
};

const watermarkImage = async (inputPath, outputPath, watermarkInfo) => {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const watermarkText = `${watermarkInfo.main}\n${watermarkInfo.footer}`;
    const fontSize = Math.max(20, Math.floor(metadata.width / 40));
    
    const svgWatermark = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .watermark { 
            fill: rgba(255, 255, 255, 0.7); 
            font-size: ${fontSize}px; 
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
        </style>
        <rect width="100%" height="60" x="0" y="${metadata.height - 60}" fill="rgba(0, 0, 0, 0.5)"/>
        <text x="10" y="${metadata.height - 35}" class="watermark">${watermarkInfo.main}</text>
        <text x="10" y="${metadata.height - 15}" class="watermark" style="font-size: ${fontSize * 0.5}px; font-weight: normal;">${watermarkInfo.footer}</text>
      </svg>
    `;

    await image
      .composite([
        {
          input: Buffer.from(svgWatermark),
          top: 0,
          left: 0,
        },
      ])
      .toFile(outputPath);

    return { success: true, path: outputPath };
  } catch (error) {
    console.error('Image watermarking error:', error);
    throw error;
  }
};

const createWatermarkedFile = async (originalPath, fileType, user, company, productName) => {
  try {
    const downloadId = uuidv4();
    const watermarkInfo = generateWatermarkText(user, company, productName, downloadId);
    
    const outputDir = path.join(process.env.UPLOAD_DIR || './uploads', 'watermarked');
    await fs.mkdir(outputDir, { recursive: true });
    
    const ext = path.extname(originalPath);
    const outputPath = path.join(outputDir, `${downloadId}${ext}`);

    if (fileType === 'pdf') {
      await watermarkPDF(originalPath, outputPath, watermarkInfo);
    } else if (['image', 'png', 'jpg', 'jpeg'].includes(fileType)) {
      await watermarkImage(originalPath, outputPath, watermarkInfo);
    } else {
      throw new Error(`Unsupported file type for watermarking: ${fileType}`);
    }

    return {
      success: true,
      path: outputPath,
      downloadId,
      watermarkText: `${watermarkInfo.main} | ${watermarkInfo.footer}`,
    };
  } catch (error) {
    console.error('Watermarking error:', error);
    throw error;
  }
};

module.exports = {
  createWatermarkedFile,
  generateWatermarkText,
};
