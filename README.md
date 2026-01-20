# EditorJS 3D Media Block

An [EditorJS](https://editorjs.io/) block tool for displaying interactive 3D models in various formats (glTF, GLB, USDZ, and more). Perfect for e-commerce product displays, educational content, engineering documentation, and WebXR experiences.

## Features

- 📦 **Multiple 3D formats** - Support for GLB, glTF, USDZ, OBJ, FBX, and more
- 🎨 **Customizable viewers** - Choose between ModelViewer or ThreeJS renderers
- 🔄 **Interactive controls** - Built-in orbit, zoom, and rotation controls
- 📱 **iOS AR support** - Optional USDZ models for AR Quick Look
- 🖼️ **Poster images** - Fallback images for better loading experience
- ✍️ **Captions** - Optional editable captions below 3D models
- 🎯 **File validation** - Custom validation before upload
- 🔌 **Flexible upload** - Custom upload handlers for any backend
- 🎭 **Custom loaders** - Replace default loading UI with your own
- ⚙️ **Custom attributes** - Add any HTML attributes to the viewer element

## Installation

```bash
npm install editorjs-3d-media
```

If using ModelViewer (default), also include the ModelViewer library:

```bash
npm install @google/model-viewer
```

Or via CDN:

```html
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js"></script>
```

## Usage

### Basic Setup

```javascript
import EditorJS from '@editorjs/editorjs';
import Media3D from 'editorjs-3d-media';

const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    media3d: {
      class: Media3D,
      config: {
        uploadFile: async (file) => {
          // Upload file to your server
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          return {
            url: data.url, // Required: URL to the 3D model
            viewer: 'modelviewer', // Required: viewer type
            otherAttributes: { // Optional: additional attributes for the viewer element
              poster: data.posterUrl,
              'ios-src': data.iosSrcUrl
            }
          };
        }
      }
    }
  }
});
```

### Advanced Configuration

```javascript
const editor = new EditorJS({
  tools: {
    media3d: {
      class: Media3D,
      config: {
        viewer: 'modelviewer',
        formatsAllowed: ['glb', 'gltf', 'usdz', 'obj'],
        enableCaption: true,
        autoOpenFilePicker: true,
        
        viewerStyle: {
          width: '100%',
          height: '500px',
          borderRadius: '12px',
          backgroundColor: '#f0f0f0'
        },
        
        uploadFile: async (file) => {
          // Your upload logic
          return {
            url: 'https://example.com/model.glb',
            viewer: 'modelviewer',
            otherAttributes: {
              poster: 'https://example.com/poster.jpg',
              'ios-src': 'https://example.com/model.usdz'
            }
          };
        },
        
        validateFile: (file) => {
          const maxSize = 50 * 1024 * 1024; // 50MB
          if (file.size > maxSize) {
            return 'File size must be less than 50MB';
          }
          return true;
        },
        
        customLoaderElement: (file) => {
          const loader = document.createElement('div');
          loader.innerHTML = `
            <div style="text-align: center; padding: 40px;">
              <div class="spinner"></div>
              <p>Uploading ${file.name}...</p>
            </div>
          `;
          return loader;
        }
      }
    }
  }
});
```

### Output Data Format

When you save the editor content, the 3D Media block will return data in this format:

```javascript
{
  type: "media3d",
  data: {
    viewer: "modelviewer",
    caption: "My 3D Model",
    file: {
      url: "https://example.com/model.glb"
    },
    attributes: {
      poster: "https://example.com/poster.jpg",
      "ios-src": "https://example.com/model.usdz"
    }
  }
}
```

## Important Details

### Viewer Types

#### ModelViewer (Default)

- Uses Google's `<model-viewer>` web component
- Best for web compatibility and AR support
- Supports GLB, glTF, and USDZ formats
- Includes built-in controls and AR Quick Look for iOS
- **Requires**: `@google/model-viewer` library to be loaded

#### ThreeJS

- Uses Three.js for rendering
- More customizable but requires manual setup
- **Note**: Currently requires you to implement the rendering logic

### File Upload

The `uploadFile` function must return a Promise that resolves to an object with:

- `url` (required): URL to the 3D model file
- `viewer` (required): The viewer type to use ('modelviewer' or 'threejs')
- `otherAttributes` (optional): Object containing additional HTML attributes to add to the viewer element
  - For ModelViewer, common attributes include `poster` (preview image) and `ios-src` (USDZ for AR Quick Look)
  - These attributes are applied directly to the viewer element (e.g., `<model-viewer poster="..." ios-src="...">`)

### File Validation

The `validateFile` function should:

- Return `true` if the file is valid
- Return a string with an error message if invalid
- Receive the File object as parameter

### Caption Support

When `enableCaption` is `true`:

- Users can add/edit captions below the 3D viewer
- Captions are saved with the block data
- Captions respect read-only mode

### Auto-Open File Picker

When `autoOpenFilePicker` is `true` (default):

- File picker opens automatically when creating a new block
- Only triggers on first render
- Does not apply in read-only mode

### Read-Only Mode

The block fully supports EditorJS read-only mode:

- Captions become non-editable
- Upload button is hidden
- Shows "No 3D model provided" message if no data exists

## Configuration Options

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `viewer` | 3D viewer library to use | `'modelviewer' \| 'threejs'` | `'modelviewer'` |
| `formatsAllowed` | Array of allowed 3D file format extensions | `string[]` | `['glb', 'gltf']` |
| `enableCaption` | Enable caption input below the 3D viewer | `boolean` | `true` |
| `autoOpenFilePicker` | Automatically open file picker on first render when empty | `boolean` | `true` |
| `viewerStyle` | Custom CSS styles for the 3D viewer element | `Partial<CSSStyleDeclaration>` | `undefined` |
| `uploadFile` | Function to handle file upload to your server | `(file: File) => Promise<{url: string, viewer: Viewer, otherAttributes?: Record<string, string>}>` | `undefined` |
| `validateFile` | Function to validate file before upload | `(file: File) => boolean \| string` | `undefined` |
| `customLoaderElement` | Custom HTML element to show during upload | `(file: File) => HTMLElement` | `undefined` |

## Browser Support

- Modern browsers with ES6+ support
- ModelViewer requires browsers that support Web Components
- iOS AR Quick Look requires iOS 12+ and Safari

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Built with:
- [EditorJS](https://editorjs.io/)
- [Google Model Viewer](https://modelviewer.dev/) (optional)
- [CodeX Icons](https://github.com/codex-team/icons)

