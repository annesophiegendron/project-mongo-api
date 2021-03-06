import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import netflixData from './data/netflix-titles.json'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const Show = mongoose.model('Show', {
  show_id: { type: Number },
  title: { type: String, required: true },
  director: { type: String, required: true },
  cast: { type: String },
  country: { type: String },
  date_added: { type: String },
  release_year: { type: Number },
  rating: { type: String },
  duration: { type: String },
  listed_in: { type: String },
  description: { type: String },
  type: { type: String }
})

const Director = mongoose.model('Director', {
  director: String,
  title: {
    type: mongoose.Schema.Types.String,
    ref: 'Title'
  }
})

const Title = mongoose.model('Title', {
  title: String,
  cast: String,
  director: {
    type: mongoose.Schema.Types.String,
    ref: 'Director'
  }
})

if (process.env.RESET_DATABASE) {
  const seedDatabase = async () => {
    await Show.deleteMany()
    await Director.deleteMany()
    await Title.deleteMany()

    netflixData.forEach((showData) => {
      new Show(showData).save()
      new Director(showData).save()
      new Title(showData).save()
    })
  }
  seedDatabase()
}

//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// MIDDLEWARES to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

// if database not connected
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailable' })
  }
})

// Routes
app.get('/', (req, res) => {
  res.send('Possible routes => paths: /shows, /lists, combinable queries: /shows?type="", /')
})

app.get('/shows', async (req, res) => {
  const shows = await Show.find()
  res.json(shows)
})

// // Show 10 results
// // http://localhost:8080/lists
app.get('/lists', async (req, res) => {
  const { page } = req.query
  const startIndex = 10 * +page
  const list = await Show.find().skip(startIndex).limit(10).exec()
  res.json(list)
})

// // Show type of show
// // http://localhost:8080/shows?type=movie
app.get('/type', async (req, res) => {
  const queryString = req.query.type
  const queryRegex = new RegExp(queryString, 'i')
  const type = await Show.find({ 'type': queryRegex })
  if (type) {
    res.json(type)
  } else {
    res.status(404).json({ message: 'Cannot find this type of show' })
  }
})

// http://localhost:8080/directors
app.get('/directors', async (req, res) => {
  const director = await Director.find()
  if (director) {
    res.json(director)
  } else {
    res.status(404).json({ error: 'Director not found' })
  }
})

// http://localhost:8080/directors/5ebd47402adc471698c30bb6
app.get('/directors/:id', async (req, res) => {
  const director = await Director.findById(req.params.id)
  if (director) {
    res.json(director)
  } else {
    res.status(404).json({ error: "Director not found" })
  }
})

app.get('/title', async (req, res) => {
  const title = await Title.find()
  if (title) {
    res.json(title)
  } else {
    res.status(404).json({ error: 'Title show not found' })
  }
})

app.get('/titles/:id', async (req, res) => {
  const title = await Title.findById(req.params.id)
  if (title) {
    res.json(title)
  } else {
    res.status(404).json({ error: "Show not found" })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
