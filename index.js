const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

// Configuración de la base de datos
const connection = mysql.createConnection({
  host: 'bbdd.ingenix.es',
  user: 'ddb250008',
  password: 'LP%vV7S.%%$4BF',
  database: 'ddb250008',
});

// Conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// 🔁 Ruta para obtener el nombre del trabajador
app.get('/trabajador', (req, res) => {
  connection.query('SELECT Nombre FROM Empleados LIMIT 1', (error, results) => {
    if (error) {
      console.error('❌ Error en la consulta:', error);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (results.length > 0) {
      res.json({ nombre: results[0].Nombre }); // Devuelve: { nombre: "Artur Roig Girbes" }
    } else {
      res.json({ nombre: 'No encontrado' });
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
