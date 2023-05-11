
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const mongo = require('mongodb')
const mongoose = require('mongoose')
const urlparser = require('url')
const dns = require('dns');
const shortid = require('shortid');
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
  url_id: {
    type: String,
    unique: true
  }
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

  if(!regex.test(inputUrl)) {
    res.json({error: 'Invalid URL'})
  } else {
      if(urlInDB) {
        res.json({
          original_url: urlInDB.original_url,
          url_id: urlInDB.url_id
        }) 
      } else {
        urlInDB = new URL ({
          original_url: inputUrl,
          url_id: shortid.generate()
        })

        await urlInDB.save()

        res.json({
          original_url: urlInDB.original_url,
          url_id: urlInDB.url_id
        })
      }
  }

})


app.get('/api/shorturl/:id', async (req, res) => {
  let paramUrl = req.params.id
  let idInDB = await URL.findOne({
    url_id: paramUrl
  })

  if(idInDB) {
      res.redirect(idInDB.original_url)
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

