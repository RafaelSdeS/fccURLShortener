
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const mongo = require('mongodb')
const mongoose = require('mongoose')
const urlparser = require('url')
const dns = require('dns');
const validUrl = require('valid_url')
const regex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:\.[a-zA-Z]{2,})+(?:\/[\w#]+\/?)*$/

const uri = process.env.DB_URI

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
}) 

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database here baby!")
})



const Schema = mongoose.Schema
const urlSchema = new Schema ({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async(req, res) => {
  const inputUrl = req.body.url
  let urlInDB =  await URL.findOne({original_url: inputUrl})

  let count = await URL.countDocuments({}) + 1


  if(!regex.test(inputUrl)) {
    res.json({error: 'Invalid URL'})
  } else {
      if(urlInDB) {
        res.json({
          original_url: urlInDB.original_url,
          short_url: urlInDB.short_url
        }) 
      } else {
        urlInDB = new URL ({
          original_url: inputUrl,
          short_url: count
        })

        await urlInDB.save()

        res.json({
          original_url: urlInDB.original_url,
          short_url: urlInDB.short_url
        })
      }
  }

})


app.get('/api/shorturl/:short_url', async (req, res) => {
  let paramUrl = req.params.short_url
  let idInDB = await URL.findOne({
    short_url: +paramUrl
  })

  if(idInDB) {
      return res.redirect(idInDB.original_url)
  } else {
      res.json({
        error: 'This URL is not in the DB'
      })
  }
})



// App listen
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

