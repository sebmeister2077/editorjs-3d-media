from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
# enable cors
CORS(app)

# The response of your uploader should cover the following format:

# {
#     "success" : 1,
#     "file": {
#         "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg",
#         // ... and any additional fields you want to store, such as width, height, color, extension, etc
#     }
# }


@app.route("/uploadFile", methods=["POST"])
def upload_file():


    return jsonify({
        "success": 1,
        "file": {
            "url": f"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/CarConcept/glTF-Binary/CarConcept.glb",
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)