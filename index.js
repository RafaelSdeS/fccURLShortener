require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const regex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:\.[a-zA-Z]{2,})+(?:\/[\w#]+\/?)*$/;

const uri = process.env.DB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
});

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connected!");
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});
const URL = mongoose.model("URL", urlSchema);

// Basic Config
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const inputUrl = req.body.url;
  if (!regex.test(inputUrl)) {
    res.json({ error: 'Invalid URL' });
  } else {
    let urlInDB = await URL.findOne({ original_url: inputUrl });

    if (urlInDB) {
      res.json({
        original_url: urlInDB.original_url,
        short_url: urlInDB.short_url
      });
    } else {
      const count = await URL.countDocuments({});
      const newUrl = new URL({
        original_url: inputUrl,
        short_url: count + 1
      });

      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url
      });
    }
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const paramUrl = req.params.short_url;
  const idInDB = await URL.findOne({ short_url: +paramUrl });

  if (idInDB) {
    res.redirect(idInDB.original_url);
  } else {
    res.json({ error: 'This URL is not in the DB' });
  }
});

// App listen
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
