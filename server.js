const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "DBconsultoriopsi",
  password: "root",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Ruta de prueba de conexión
app.get("/api/prueba-conexion", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ mensaje: "Conexión exitosa a la base de datos" });
  } catch (error) {
    console.error("Error al conectar:", error);
    return res
      .status(500)
      .json({ error: "Error al conectar con la base de datos" });
  }
});

// Ruta para ver usuarios
app.get("/api/ver-usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Usuarios");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});
app.post("/api/ing-usuarios", async (req, res) => {
  const { email, rol, fecha_creacion } = req.body;
  try {
    if (!email || !rol || !fecha_creacion) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    const result = await pool.query(
      "INSERT INTO Usuarios (email,rol,fecha_creacion) VALUES ($1, $2, $3) RETURNING *",
      [email, rol, fecha_creacion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear usuario", detalle: err.message });
  }
});

// ========================================
// Rutas de Terapeutas
// ========================================
app.get("/api/terapeutas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_terapeuta, nombre, apellido FROM Terapeutas"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener terapeutas" });
  }
});
app.get("/api/listar-terapeutas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Terapeutas");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener terapeutas" });
  }
});
app.post("/api/terapeutas", async (req, res) => {
  const { nombre, apellido, correo, especialidad } = req.body;
  try {
    if (!nombre || !apellido || !correo || !especialidad) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    const result = await pool.query(
      "INSERT INTO Terapeutas (nombre, apellido, correo, especialidad) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, apellido, correo, especialidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear terapeuta", detalle: err.message });
  }
});

// ========================================
// Rutas de Pacientes
// ========================================
app.get("/api/pacientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Pacientes ORDER BY id DESC");
    console.log("Datos enviados:", result.rows); // Verifica qué datos salen del backend
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener pacientes:", err);
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
});

app.post("/api/pacientes", async (req, res) => {
  const {
    nombre,
    apellido,
    cedula,
    edad,
    correo,
    tipo_atencion,
    direccion,
    eps,
    terapeuta_id,
  } = req.body;
  try {
    const pacienteResult = await pool.query(
      `INSERT INTO Pacientes 
        (nombre, apellido, cedula, edad, correo, tipo_atencion, direccion, eps, terapeuta_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nombre,
        apellido,
        cedula,
        edad,
        correo,
        tipo_atencion,
        direccion,
        eps,
        terapeuta_id,
      ]
    );
    // Agregar a la lista de espera
    await pool.query(
      "INSERT INTO ListaEspera (paciente_id, terapeuta_id) VALUES ($1, $2)",
      [pacienteResult.rows[0].id_paciente, terapeuta_id]
    );
    res.status(201).json(pacienteResult.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear paciente", detalle: err.message });
  }
});

app.get("/api/pacientes/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Pacientes WHERE id_paciente = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener paciente", detalle: err.message });
  }
});

app.get("/api/terapeutas/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Terapeutas WHERE id_terapeuta = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Terapeuta no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener terapeuta", detalle: err.message });
  }
});

app.patch("/api/terapeutas/:id", async (req, res) => {
  const { nombre, apellido, correo, especialidad } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Terapeutas 
       SET nombre = $1, apellido = $2, correo = $3, especialidad = $4
       WHERE id_terapeuta = $5 RETURNING *`,
      [nombre, apellido, correo, especialidad, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Terapeuta no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al actualizar terapeuta", detalle: err.message });
  }
});
app.patch("/api/pacientes/:id", async (req, res) => {
  const { nombre, apellido, cedula, correo, tipo_atencion } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Pacientes 
       SET nombre = $1, apellido = $2, cedula = $3, correo = $4, tipo_atencion = $5
       WHERE id_paciente = $6 RETURNING *`,
      [nombre, apellido, cedula, correo, tipo_atencion, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al actualizar paciente", detalle: err.message });
  }
});

// ========================================
// Rutas de Lista de Espera
// ========================================
app.get("/api/lista-espera", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT le.id_lista, le.paciente_id, le.terapeuta_id,
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             t.nombre AS terapeuta_nombre, t.apellido AS terapeuta_apellido
      FROM ListaEspera le
      JOIN Pacientes p ON le.paciente_id = p.id_paciente
      JOIN Terapeutas t ON le.terapeuta_id = t.id_terapeuta
      ORDER BY le.creado_en ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener lista de espera" });
  }
});

app.get("/api/lista-espera/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT le.id_lista, le.paciente_id, le.terapeuta_id,
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             t.nombre AS terapeuta_nombre, t.apellido AS terapeuta_apellido
      FROM ListaEspera le
      JOIN Pacientes p ON le.paciente_id = p.id_paciente
      JOIN Terapeutas t ON le.terapeuta_id = t.id_terapeuta
      WHERE le.id_lista = $1
    `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Paciente no encontrado en lista de espera" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener paciente de lista de espera" });
  }
});

// ========================================
// Rutas de Citas
// ========================================
app.post("/api/citas", async (req, res) => {
  const { paciente_id, terapeuta_id, fecha_hora, duracion } = req.body;
  try {
    const errores = [];
    if (!paciente_id) errores.push("paciente_id es requerido");
    if (!terapeuta_id) errores.push("terapeuta_id es requerido");
    if (!fecha_hora) errores.push("fecha_hora es requerida");
    if (errores.length > 0)
      return res
        .status(400)
        .json({ error: "Datos incompletos", detalles: errores });

    const result = await pool.query(
      `INSERT INTO Citas (paciente_id, terapeuta_id, fecha_hora, duracion, estado)
       VALUES ($1, $2, $3, $4, 'pendiente') RETURNING *`,
      [
        paciente_id,
        terapeuta_id,
        new Date(fecha_hora).toISOString(),
        duracion || "1 hour",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear cita", detalle: err.message });
  }
});

app.patch("/api/citas/:id/completar", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE Citas SET estado = 'completada' WHERE id_cita = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    await pool.query(
      "DELETE FROM ListaEspera WHERE paciente_id = $1 AND terapeuta_id = $2",
      [result.rows[0].paciente_id, result.rows[0].terapeuta_id]
    );
    res.json({
      mensaje: "Cita completada y paciente eliminado de la lista de espera",
      cita: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

app.delete("/api/citas/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM Citas WHERE id_cita = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Cita no encontrada" });
    res.json({ mensaje: "Cita eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar cita" });
  }
});

app.get("/api/citas-lista/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT c.*, 
        p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        t.nombre AS terapeuta_nombre, t.apellido AS terapeuta_apellido
      FROM Citas c
      JOIN ListaEspera le ON c.paciente_id = le.paciente_id 
        AND c.terapeuta_id = le.terapeuta_id
      JOIN Pacientes p ON c.paciente_id = p.id_paciente
      JOIN Terapeutas t ON c.terapeuta_id = t.id_terapeuta
      WHERE le.id_lista = $1
      ORDER BY c.fecha_hora DESC
    `,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en consulta de citas:", err);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

app.get("/api/citas-completadas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id_cita, c.fecha_hora, 
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             t.nombre AS terapeuta_nombre, t.apellido AS terapeuta_apellido,
             p.tipo_atencion
      FROM Citas c
      JOIN Pacientes p ON c.paciente_id = p.id_paciente
      JOIN Terapeutas t ON c.terapeuta_id = t.id_terapeuta
      WHERE c.estado = 'completada'
      ORDER BY c.fecha_hora DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener citas completadas" });
  }
});

app.get("/api/citas/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT c.*, 
      p.nombre AS paciente_nombre, 
      p.apellido AS paciente_apellido,
      p.edad,
      p.cedula,
      p.direccion,
      p.eps,
      p.tipo_atencion,
      t.nombre AS terapeuta_nombre, 
      t.apellido AS terapeuta_apellido
FROM Citas c
JOIN Pacientes p ON c.paciente_id = p.id_paciente
JOIN Terapeutas t ON c.terapeuta_id = t.id_terapeuta
WHERE c.id_cita = $1
    `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener cita:", err);
    res.status(500).json({ error: "Error al obtener cita" });
  }
});

// Ruta para guardar (crear o actualizar) reportes (Upsert)
app.post("/api/reportes/save", async (req, res) => {
  const { cita_id, contenido, duracion, editor } = req.body;

  try {
    // Verificar que la cita existe
    const citaExistente = await pool.query(
      "SELECT * FROM Citas WHERE id_cita = $1",
      [cita_id]
    );
    if (citaExistente.rowCount === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Actualizar la duración en la tabla de Citas (si se envía)
    if (duracion) {
      await pool.query("UPDATE Citas SET duracion = $1 WHERE id_cita = $2", [
        duracion,
        cita_id,
      ]);
    }

    // Buscar si ya existe un reporte para esa cita
    const reporteExistente = await pool.query(
      "SELECT * FROM Reportes WHERE cita_id = $1",
      [cita_id]
    );

    let result;
    if (reporteExistente.rowCount > 0) {
      // Actualizar el reporte existente incluyendo el campo editor
      result = await pool.query(
        "UPDATE Reportes SET contenido = $1, editor = $2 WHERE cita_id = $3 RETURNING *",
        [contenido, editor, cita_id]
      );
      res.json({
        mensaje: "Reporte actualizado exitosamente",
        reporte: result.rows[0],
      });
    } else {
      // Insertar un nuevo reporte con el campo editor
      result = await pool.query(
        "INSERT INTO Reportes (cita_id, contenido, editor) VALUES ($1, $2, $3) RETURNING *",
        [cita_id, contenido, editor]
      );
      res.status(201).json({
        mensaje: "Reporte creado exitosamente",
        reporte: result.rows[0],
      });
    }
  } catch (err) {
    console.error("Error al guardar reporte:", err);
    res
      .status(500)
      .json({ error: "Error al guardar reporte", detalle: err.message });
  }
});

app.get("/api/reportes/:cita_id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT r.id_reporte,
             r.cita_id,
             r.contenido,
             r.editor, 
             r.creado_en,
             c.duracion::text AS duracion
      FROM Reportes r
      JOIN Citas c ON r.cita_id = c.id_cita
      WHERE r.cita_id = $1
    `,
      [req.params.cita_id]
    );

    console.log(
      "Consulta GET /api/reportes/" + req.params.cita_id,
      result.rows
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener reporte:", err);
    res
      .status(500)
      .json({ error: "Error al obtener reporte", detalle: err.message });
  }
});

// ========================================
// Ruta para login con Google
// ========================================
app.post("/api/login-google", async (req, res) => {
  try {
    const { tokenId } = req.body;

    // Verificar el token usando la librería oficial de Google sería lo ideal.
    // Aquí se decodifica el JWT de forma simple para extraer el payload.
    const payload = JSON.parse(
      Buffer.from(tokenId.split(".")[1], "base64").toString()
    );
    const email = payload.email;

    // Validar que el correo tenga el dominio permitido
    if (!email.endsWith("@amigo.edu.co")) {
      return res
        .status(403)
        .json({ error: "Solo se permiten correos @amigo.edu.co" });
    }

    // Buscar el usuario en la base de datos
    let result = await pool.query(
      "SELECT email, rol FROM Usuarios WHERE email = $1",
      [email]
    );

    // Si el usuario no existe, crearlo con rol "terapeuta"
    if (result.rowCount === 0) {
      const insertResult = await pool.query(
        "INSERT INTO Usuarios (email, rol) VALUES ($1, $2) RETURNING email, rol",
        [email, "terapeuta"]
      );
      result = insertResult;
    }

    res.json({
      email: result.rows[0].email,
      rol: result.rows[0].rol,
    });
  } catch (error) {
    console.error("Error en login con Google:", error);
    res.status(500).json({ error: "Error de autenticación" });
  }
});

// Servir archivos estáticos (asegúrate de que esta línea esté al final)
app.use(express.static("public"));

// Iniciar servidor
const server = app.listen(5001, () => {
  console.log("Servidor HTTP en http://localhost:5001");
});
