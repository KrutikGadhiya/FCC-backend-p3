require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const { isWebUri } = require('valid-url')
const shortId = require('shortid')

mongoose.connect(process.env.MOGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: "false"}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urlSchema = mongoose.Schema({
  originalUrl: String,
  shortUrl: String
})

const urlModel = mongoose.model('URL', urlSchema)

app.post('/api/shorturl', async (req, res) => {
  const {url} = req.body
  const code = shortId.generate()

  if(!isWebUri(url)) return res.status(401).json({error: 'invalid url'})

  try{
    const found = await urlModel.findOne({originalUrl: url})
    if(found) return res.json({original_url: found.originalUrl, short_url: found.shortUrl})

    const newUrl = urlModel({
      originalUrl: url,
      shortUrl: code
    })
    const saved = await newUrl.save()
    res.json({original_url: saved.originalUrl, short_url: saved.shortUrl})
  }
  catch (err){
    console.log(err)
    res.status(500).json({error: "Server Error"})
  }
})

app.get('/api/shorturl/:url', async (req, res) => {
  const { url } = req.params
  try{
    const foundUrl = await urlModel.findOne({shortUrl: url})
    if(foundUrl) return res.redirect(foundUrl.originalUrl)
    return res.status(401).json({error: 'No Url Found'})
  }
  catch (err){
    console.log(err)
    res.status(500).json({error: "Server Error"})
  }
})




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
