from paddleocr import PaddleOCR
import cv2

# Initialize OCR model (enable angle classification with cls=True)
ocr = PaddleOCR(use_angle_cls=True, lang='en')  # Set lang='en' for English

def extract_text_from_image(image_path):
    # Read image
    img = cv2.imread(image_path)
    
    # Run OCR
    result = ocr.ocr(img, cls=True)

    # Return empty string if result is None or not in expected format
    if not result or not isinstance(result, list):
        return ""

    extracted_text = []

    # Extract text from OCR result
    for line in result:
        if not line:
            continue
        for word_info in line:
            text = word_info[1][0]  # Extract the text part
            extracted_text.append(text)

    # Combine and clean up
    clean_text = ' '.join(extracted_text).replace('\n', ' ').strip()
    return clean_text

image_path = "image.png"
text = extract_text_from_image(image_path)
print("Extracted Text:", text)
