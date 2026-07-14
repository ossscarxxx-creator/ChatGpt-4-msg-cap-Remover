# AI Image Editor

Este añadido crea una implementación mínima de un editor de imágenes con inpainting (edición por máscara) apoyado en la API de OpenAI Images Edits. Está dividido en frontend (static) y un backend proxy en Node/Express que reenvía la petición a OpenAI y devuelve la imagen resultante como base64.

Rama: add/ai-image-editor

Qué se añadió:

- server/package.json
- server/index.js — servidor Express que expone `/api/edit`.
- public/index.html — UI en español para cargar imagen, pintar máscara y enviar prompt.
- public/styles.css — estilos básicos.
- public/js/editor.js — lógica del editor: carga imagen, pinta máscara, prepara máscara (convierte las áreas pintadas a transparentes) y envía al backend.

Cómo usar (local):

1. Clona el repo y cambia a la rama `add/ai-image-editor`.
2. Ve a la carpeta `server` e instala dependencias:

   npm install

3. Crea un fichero `.env` en `server` con:

   OPENAI_API_KEY=tu_api_key_aqui

4. Ejecuta el servidor:

   npm start

5. Abre http://localhost:3000 en tu navegador.

Notas importantes:

- No incluyo la API key en el repositorio. Si despliegas a producción, usa GitHub Secrets o el proveedor de variables de entorno de tu hosting.
- La implementación usa el endpoint `POST https://api.openai.com/v1/images/edits` con `response_format=b64_json`. Asegúrate de que tu cuenta y clave soporten este endpoint.
- Limitaciones: es un MVP. Mejoras posibles: validación y control de tamaños, undo/redo, ajustes de máscara más avanzados, una cola de trabajos si el procesado tarda, autenticación, y control de costes.

Si quieres que abra un Pull Request para fusionar los cambios en la rama principal, o que añada deploy (GitHub Pages para la parte estática + servidor en e.g. Render/Heroku), dime y lo preparo.
