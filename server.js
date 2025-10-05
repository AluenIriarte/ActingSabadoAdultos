const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Endpoint para guardar los datos
app.post('/saveData', async (req, res) => {
    try {
        const { content } = req.body;
        await fs.writeFile(path.join(__dirname, 'data.js'), content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error al guardar el archivo:', error);
        res.json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});