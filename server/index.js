const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.use(require('cors')());
app.use(express.static(path.join(__dirname, '..', 'public')));

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. The /api/edit endpoint will fail without it.');
}

// POST /api/edit -> accepts multipart form with 'image' (file), 'mask' (file, optional), 'prompt' (text)
app.post('/api/edit', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]), async (req, res) => {
  try {
    const prompt = req.body.prompt || '';
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'Missing image file' });
    }

    const imageFile = req.files.image[0];
    const maskFile = req.files.mask ? req.files.mask[0] : null;

    const form = new FormData();
    form.append('image', fs.createReadStream(imageFile.path), imageFile.originalname);
    if (maskFile) {
      form.append('mask', fs.createReadStream(maskFile.path), maskFile.originalname);
    }
    form.append('prompt', prompt);
    // request base64 to simplify returning the image to the browser
    form.append('response_format', 'b64_json');

    const resp = await axios.post('https://api.openai.com/v1/images/edits', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    // OpenAI Images Edits typically returns data[0].b64_json
    const data = resp.data;
    if (data && data.data && data.data[0] && data.data[0].b64_json) {
      const b64 = data.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;
      res.json({ image: dataUrl });
    } else if (data && data.data && data.data[0] && data.data[0].url) {
      // fallback to URL
      res.json({ image_url: data.data[0].url });
    } else {
      res.status(500).json({ error: 'Unexpected response from OpenAI', raw: data });
    }

    // cleanup uploaded files
    try { fs.unlinkSync(imageFile.path); } catch (e) { /* ignore */ }
    if (maskFile) { try { fs.unlinkSync(maskFile.path); } catch (e) { /* ignore */ } }
  } catch (err) {
    console.error('/api/edit error', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Server error', detail: err?.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Image Editor server listening on http://localhost:${PORT}`);
});
