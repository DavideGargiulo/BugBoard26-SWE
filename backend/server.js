const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
// const bcrypt = require('bcrypt') // Aggiungi questa dipendenza
const app = express()
const port = 3000

// Crea un pool di connessioni riutilizzabili
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

// Configura CORS per accettare richieste da Angular
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}))

// Middleware per parsare JSON
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  // Validazione input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const query = 'SELECT * FROM utente WHERE email = $1'
    const result = await pool.query(query, [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    // VERIFICA LA PASSWORD
    // Se usi bcrypt (RACCOMANDATO):
    // const isPasswordValid = await bcrypt.compare(password, user.password)

    // Oppure se la password è in chiaro nel DB (NON SICURO):
    const isPasswordValid = password === user.password

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    return res.json({
      success: true,
      userId: user.id,
      username: user.username
    })

  } catch (err) {
    console.error('Login error details:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Gestione chiusura graceful
process.on('SIGTERM', () => {
  pool.end()
})