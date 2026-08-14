const express = require('express');
const app = express();

// Railway asigna el puerto por variable de entorno; en local usa 3000
const PORT = process.env.PORT || 3000;

// Datos del estudiante / proyecto
const ESTUDIANTE = "Camilo Escobar";

// URL del servicio del profesor (se puede sobreescribir con una variable
// de entorno TEACHER_URL en Railway sin tocar el código)
const TEACHER_URL = process.env.TEACHER_URL || "https://callback-iot-service-production.up.railway.app/data";

// Middleware para recibir JSON
app.use(express.json());

// ============================================
// GET / - Info del servicio
// ============================================
app.get("/", (req, res) => {
    res.json({
        servicio: "IoT Service - Camilo Escobar",
        estudiante: ESTUDIANTE,
        endpoints: {
            "GET /data": "Últimos registros recibidos del profesor",
            "POST /visualize": "Envía datos de mis sensores al profesor"
        },
        estado: "activo"
    });
});

// ============================================
// GET /data - Obtiene los últimos registros del profesor
// ============================================
app.get("/data", async (req, res) => {
    try {
        const respuesta = await fetch(TEACHER_URL);
        const datos = await respuesta.json();
        const ultimosRegistros = datos.slice(-100);
        res.json(ultimosRegistros);
    } catch (error) {
        console.error(`❌ [${ESTUDIANTE}] Error en GET /data:`, error.message);
        res.status(500).json({
            error: "No se pudieron obtener los datos del profesor",
            mensaje: error.message
        });
    }
});

// ============================================
// POST /visualize - Recibe datos y los envía al profesor
// ============================================
app.post("/visualize", async (req, res) => {
    const datosRecibidos = req.body;

    // Validar que llegaron datos
    if (!datosRecibidos || Object.keys(datosRecibidos).length === 0) {
        return res.status(400).json({
            error: "No se enviaron datos",
            sugerencia: "Envía un JSON con temperatura, humedad, etc."
        });
    }

    try {
        console.log(`📥 [${ESTUDIANTE}] Datos recibidos del ESP32:`, datosRecibidos);

        // Enviar los datos al profesor en Railway
        const respuestaProfesor = await fetch(TEACHER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosRecibidos)
        });

        if (!respuestaProfesor.ok) {
            throw new Error(`Error del profesor: ${respuestaProfesor.status}`);
        }

        const resultadoProfesor = await respuestaProfesor.json();

        console.log(`✅ [${ESTUDIANTE}] Datos enviados al profesor correctamente`);

        // Responder al estudiante
        res.json({
            mensaje: "✅ Datos enviados al profesor correctamente",
            estudiante: ESTUDIANTE,
            datosEnviados: datosRecibidos,
            respuestaProfesor: resultadoProfesor,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`❌ [${ESTUDIANTE}] Error en POST /visualize:`, error.message);
        res.status(500).json({
            error: "No se pudo enviar al profesor",
            mensaje: error.message,
            sugerencia: "Verifica que el servicio del profesor esté activo"
        });
    }
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(PORT, () => {
    console.log(`✅ [${ESTUDIANTE}] Servidor corriendo en el puerto ${PORT}`);
    console.log(`📊 GET  /data       -> últimos registros del profesor`);
    console.log(`📤 POST /visualize  -> enviar datos al profesor`);
    console.log(`💡 Profesor: ${TEACHER_URL}`);
});