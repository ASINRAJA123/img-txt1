from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import cv2
import numpy as np
import base64
import io
from PIL import Image
import os
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OCR model (enable angle classification with cls=True)
ocr = PaddleOCR(use_angle_cls=True, lang='en')

GROQ_API_KEY = "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"  # Set this in your environment
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"  # or any other model like llama3-70b

def extract_text_from_image(image_data):
    try:
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes))
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        result = ocr.ocr(opencv_image, cls=True)

        if not result or not isinstance(result, list):
            return ""

        extracted_text = []
        for line in result:
            if not line:
                continue
            for word_info in line:
                if len(word_info) >= 2 and len(word_info[1]) >= 1:
                    text = word_info[1][0]
                    extracted_text.append(text)

        clean_text = ' '.join(extracted_text).replace('\n', ' ').strip()
        return clean_text
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return ""

@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        image_data = data['image']
        extracted_text = extract_text_from_image(image_data)

        return jsonify({
            'success': True,
            'text': extracted_text
        })
    except Exception as e:
        print(f"Error in extract_text endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/format-text', methods=['POST'])
def format_text():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'success': False, 'error': 'Text not provided'}), 400

        user_text = data['text']

        # Prompt the LLaMA model
        prompt = (
            "You are a helpful assistant. Convert the following unstructured text into a JSON array "
            "representing rows of a table. Each row should be a list of cells. Don't explain. "
            f"Text:\n\"\"\"\n{user_text}\n\"\"\"\n\n"
            "Respond with only a JSON array like:\n[[\"Header1\", \"Header2\"], [\"Row1Col1\", \"Row1Col2\"]]"
        )

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "You are a text-to-table formatter."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        raw_output = result['choices'][0]['message']['content'].strip()

        # Safely parse the JSON array
        import json
        table = json.loads(raw_output)

        return jsonify({
            'success': True,
            'table': table
        })

    except Exception as e:
        print(f"Error formatting text: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
