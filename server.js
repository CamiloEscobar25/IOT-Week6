// ============================================
// SERVIDOR SCADA IOT CON DATALOGGER MQTT (HIVEMQ CLOUD)
// ============================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// --- CONFIGURACIÓN DEL DATALOGGER MQTT CIFRADO ---
const mqttBroker = "mqtts://vamilo:a1c2b3d4@978946dac5b84c10b8eaa021f0a435eb.s1.eu.hivemq.cloud:8883";
const topicTelemetria = "industrial/almacen_auth_89f3/telemetria";
const ARCHIVO_DB = 'datos.json';

// Cliente MQTT en el Backend con TLS
const mqttClient = mqtt.connect(mqttBroker, {
    rejectUnauthorized: false
});

mqttClient.on('connect', () => {
    console.log(`📡 [MQTT] Backend conectado exitosamente a HiveMQ Cloud (TLS)`);
    mqttClient.subscribe(topicTelemetria);
    console.log(`👂 [MQTT] Escuchando telemetría en: ${topicTelemetria}`);
});

mqttClient.on('message', (topic, message) => {
    if (topic === topicTelemetria) {
        try {
            const telemetria = JSON.parse(message.toString());

            let datosGuardados = [];
            if (fs.existsSync(ARCHIVO_DB)) {
                datosGuardados = JSON.parse(fs.readFileSync(ARCHIVO_DB, 'utf8'));
            }

            if (datosGuardados.length >= 2000) {
                datosGuardados.shift();
            }

            const nuevoRegistro = {
                ...telemetria,
                timestamp: new Date().toISOString(),
                origen: "MQTT_AutoLogger"
            };

            datosGuardados.push(nuevoRegistro);
            fs.writeFileSync(ARCHIVO_DB, JSON.stringify(datosGuardados, null, 2));
            console.log(`💾 [DATALOGGER] Registro guardado. (Temp: ${telemetria.temp}°C, Gas: ${telemetria.gas})`);

        } catch (error) {
            console.error("❌ [MQTT] Error procesando mensaje:", error.message);
        }
    }
});

// --- RUTAS HTTP ---

app.post("/data", (req, res) => {
    const datosRecibidos = req.body;
    if (!datosRecibidos || Object.keys(datosRecibidos).length === 0) {
        return res.status(400).json({ error: "No se enviaron datos" });
    }
    try {
        let datosGuardados = [];
        if (fs.existsSync(ARCHIVO_DB)) {
            datosGuardados = JSON.parse(fs.readFileSync(ARCHIVO_DB, 'utf8'));
        }
        const nuevoRegistro = {
            ...datosRecibidos,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            origen: "HTTP_POST"
        };
        datosGuardados.push(nuevoRegistro);
        fs.writeFileSync(ARCHIVO_DB, JSON.stringify(datosGuardados, null, 2));
        res.json({ mensaje: "✅ Datos HTTP guardados correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Fallo al guardar datos" });
    }
});

app.get("/data", (req, res) => {
    try {
        if (fs.existsSync(ARCHIVO_DB)) {
            const dataLocal = fs.readFileSync(ARCHIVO_DB, 'utf8');
            res.json(JSON.parse(dataLocal));
        } else {
            res.json([]);
        }
    } catch (e) {
        res.json([]);
    }
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/", (req, res) => {
    res.json({
        servicio: "SCADA Backend Server",
        estado: "Operativo",
        modulos: {
            mqtt_logger: "Activo escuchando a HiveMQ Cloud",
            api_rest: "Activa"
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`✅ Servidor Industrial corriendo en puerto ${PORT}`);
    console.log(`📊 API Historial : GET /data`);
    console.log(`🖥️  Dashboard     : GET /dashboard`);
    console.log(`=========================================\n`);
});
