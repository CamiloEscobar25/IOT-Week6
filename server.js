const express = require('express');
const app = express();

// Railway asigna el puerto por variable de entorno; en local usa 3000
const PORT = process.env.PORT || 3000;

// Datos del estudiante / proyecto
const ESTUDIANTE = "Camilo Escobar";

// Middleware para recibir JSON
app.use(express.json());

// ============================================
// "Base de datos" en memoria
// (se reinicia si Railway reinicia el servicio; para un proyecto de
// clase es suficiente, no necesitas una base de datos real)
// ============================================
let registros = [];
const MAX_REGISTROS = 500; // evita que la memoria crezca sin límite

// ============================================
// GET / - Info del servicio
// ============================================
app.get("/", (req, res) => {
    res.json({
        servicio: "IoT Service - Camilo Escobar",
        estudiante: ESTUDIANTE,
        endpoints: {
            "GET /data": "Devuelve mis últimos registros guardados",
            "POST /visualize": "Recibe datos de mi ESP32 y los guarda"
        },
        totalRegistros: registros.length,
        estado: "activo"
    });
});

// ============================================
// GET /data - Devuelve los últimos registros guardados
// ============================================
app.get("/data", (req, res) => {
    const ultimosRegistros = registros.slice(-100);
    res.json(ultimosRegistros);
});

// ============================================
// POST /visualize - Recibe datos del ESP32 y los guarda
// ============================================
app.post("/visualize", (req, res) => {
    const datosRecibidos = req.body;

    // Validar que llegaron datos
    if (!datosRecibidos || Object.keys(datosRecibidos).length === 0) {
        return res.status(400).json({
            error: "No se enviaron datos",
            sugerencia: "Envía un JSON con temperatura, humedad, etc."
        });
    }

    console.log(`📥 [${ESTUDIANTE}] Datos recibidos del ESP32:`, datosRecibidos);

    // Le agregamos un timestamp propio y lo guardamos
    const registro = {
        ...datosRecibidos,
        timestamp: new Date().toISOString()
    };

    registros.push(registro);

    // Si nos pasamos del máximo, botamos los más viejos
    if (registros.length > MAX_REGISTROS) {
        registros = registros.slice(-MAX_REGISTROS);
    }

    console.log(`✅ [${ESTUDIANTE}] Guardado. Total registros: ${registros.length}`);

    res.json({
        mensaje: "✅ Datos guardados correctamente",
        estudiante: ESTUDIANTE,
        registroGuardado: registro,
        totalRegistros: registros.length
    });
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(PORT, () => {
    console.log(`✅ [${ESTUDIANTE}] Servidor corriendo en el puerto ${PORT}`);
    console.log(`📊 GET  /data       -> ver mis datos guardados`);
    console.log(`📤 POST /visualize  -> guardar datos del ESP32`);
});