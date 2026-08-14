// ============================================
// SERVIDOR COMPLETO PARA IOT
// ============================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post("/data", (req, res) => {
    const datosRecibidos = req.body;
    if (!datosRecibidos || Object.keys(datosRecibidos).length === 0) {
        return res.status(400).json({
            error: "No se enviaron datos"
        });
    }
    try {
        let datosGuardados = [];
        try {
            const dataLocal = fs.readFileSync('datos.json', 'utf8');
            datosGuardados = JSON.parse(dataLocal);
        } catch (e) {
            console.log("📝 Creando nuevo archivo de datos");
        }
        const nuevoRegistro = {
            ...datosRecibidos,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'] || 'unknown'
        };
        datosGuardados.push(nuevoRegistro);
        fs.writeFileSync('datos.json', JSON.stringify(datosGuardados, null, 2));
        console.log(`✅ Datos guardados (total: ${datosGuardados.length} registros)`);
        res.json({
            mensaje: "✅ Datos recibidos y guardados correctamente",
            totalRegistros: datosGuardados.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({
            error: "No se pudieron guardar los datos",
            mensaje: error.message
        });
    }
});

app.get("/data", (req, res) => {
    try {
        const dataLocal = fs.readFileSync('datos.json', 'utf8');
        const datos = JSON.parse(dataLocal);
        res.json(datos);
    } catch (e) {
        res.json([]);
    }
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get("/", (req, res) => {
    res.json({
        servicio: "Callback IoT para Estudiantes",
        endpoints: {
            "POST /data": "Enviar datos de sensores",
            "GET /data": "Ver todos los datos",
            "GET /dashboard": "Dashboard web"
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servicio funcionando en puerto ${PORT}`);
    console.log(`📊 GET /data -> https://iot-week6-production.up.railway.app/data`);
    console.log(`📤 POST /data -> https://iot-week6-production.up.railway.app/data`);
    console.log(`📱 Dashboard -> https://iot-week6-production.up.railway.app/dashboard`);
});
