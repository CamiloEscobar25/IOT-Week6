const express = require('express');
const app = express();
const PORT = 3000;
 
// Middleware para recibir JSON
app.use(express.json());
 
// ============================================
// GET /data - Obtiene los últimos 2 registros del profesor
// ============================================
app.get("/data", async (req, res) => {
    try {
        const respuesta = await fetch("https://callback-iot-service-production.up.railway.app/data");
        const datos = await respuesta.json();
        const ultimosDos = datos.slice(-100);
        res.json(ultimosDos);
    } catch (error) {
        console.error("❌ Error en GET /data:", error.message);
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
        console.log("📥 Datos recibidos del estudiante:", datosRecibidos);
 
        // Enviar los datos al profesor en Railway
        const respuestaProfesor = await fetch("https://callback-iot-service-production.up.railway.app/data", {
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
 
        console.log("✅ Datos enviados al profesor correctamente");
 
        // Responder al estudiante
        res.json({
            mensaje: "✅ Datos enviados al profesor correctamente",
            datosEnviados: datosRecibidos,
            respuestaProfesor: resultadoProfesor,
            timestamp: new Date().toISOString()
        });
 
    } catch (error) {
        console.error("❌ Error en POST /visualize:", error.message);
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
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 GET /data  -> http://localhost:${PORT}/data`);
    console.log(`📤 POST /visualize -> http://localhost:${PORT}/visualize`);
    console.log(`💡 Los datos se envían al profesor en Railway`);
});
