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
            "url":"https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.rawpixel.com%2Fimage_800%2FcHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3NrOTc5MS1pbWFnZS1rd3Z1amE5Ni5qcGc.jpg&f=1&nofb=1&ipt=067fcdb964a59ba37b1cd2fe2b9b25a45ea69c2586bf7f311ec0aeb1f9bde4ef"
            # "url": f"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/CarConcept/glTF-Binary/CarConcept.glb",
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)