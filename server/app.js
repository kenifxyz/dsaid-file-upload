const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const { v4: uuidv4 } = require('uuid'); // to reduce file upload collisions

dotenv.config();

const app = express();
app.use(cors());
// app.use(cors({
//   origin: [
//     'https://dsaid-fe.kenif.xyz'
//   ]
// }));

const port = process.env.PORT || 8080;

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const stage = process.env.STAGE;

// create a Sequelize instance and define the Video model
const sequelize = new Sequelize(`postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`);
const Video = sequelize.define('Video', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storagePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  uuid: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true, // disable timestamps (createdAt, updatedAt)
});
// sequelize.sync(); // create the Video table if it doesn't already exist 

// configure multer to store uploaded files in the 'uploads' directory
// ideally would want to relay this to s3 or something
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4(); // generate a random uuid to reduce collisions
    const extension = file.originalname.split('.').pop();
    const filename = `${uniqueId}.${extension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });


// post route for handling video uploads
app.post('/upload', upload.single('video'), async (req, res) => {
  // extract video metadata from the request body
  const { title, startDateTime, location, termsChecked } = req.body;


  // validate the request body
  if (!title || !startDateTime || !termsChecked) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  if (termsChecked !== "true") {
    return res.status(400).json({
      success: false,
      message: 'Terms must be checked',
    });
  }

  // validate file extension (must be .mp4 or .mov)
  const validExtensions = ['mp4', 'mov'];
  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
  if (!validExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file extension',
    });
  }
  

  // generate a random uuid for the file, and check if it already exists, until a unique one is found
  let uuid = uuidv4();
  uuid = uuid.replace(/-/g, '').substring(0, 8);
  let fileExists = await Video.findOne({ where: { filename: `${uuid}.${fileExtension}` } });
  while (fileExists) {
    uuid = uuidv4();
    uuid = uuid.replace(/-/g, '').substring(0, 8);
    fileExists = await Video.findOne({ where: { filename: `${uuid}.${fileExtension}` } });
  }

  // create a new Video instance with the metadata and filename
  const newVideo = await Video.create({
    title,
    location: location || null,
    start_time: new Date(startDateTime),
    filename: req.file.originalname,
    storagePath: null,
    uuid
  });

  // get the Id of the newly created Video instance
  const videoId = newVideo.id;

  const storagePath = `uploads/${videoId}.${req.file.originalname.split('.').pop()}`;
  console.log(storagePath)
  // rename the file
  fs.renameSync(`uploads/${req.file.filename}`, storagePath);

  
  // update the Video instance with the storage path
  await Video.update({
    storagePath,
  }, {
    where: {
      id: videoId,
    },
  });

  // send SSE updates as the file is being uploaded
  const fileSize = req.file.size;
  const filePath = storagePath;
  const readStream = fs.createReadStream(filePath);

  readStream.on('data', chunk => {
    const bytesUploaded = readStream.bytesRead;
    const percentage = (bytesUploaded / fileSize) * 100;
    res.write(`data: ${percentage.toFixed(2)}\n\n`);
  });

  // when completed, send a 200 response
  res.status(200).json({
    success: true,
    message: `Video uploaded with ID ${newVideo.uuid}`,
    videoId: newVideo.uuid,
  });

});

// get route to test database connection
app.get('/test_db', async (req, res) => {
  try {
    await sequelize.authenticate();
    // await Video.create({
    //   title: "Dummy Video",
    //   location: "Dummy Location",
    //   start_time: new Date(),
    //   filename: "dummy_video.mp4",
    // });
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
    });
  } catch (error) {
    res.status(500).json({
    success: false,
    message: 'Database connection error',
    error: error.message,
    });
    }
});

// get route to view an uploaded video
app.get('/watch/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  
  // find the video in the database by uuid
  const video = await Video.findOne({ where: { uuid: videoId } });
  
  if (!video) {
    return res.status(404).json({
    success: false,
    message: 'Video not found on database',
    });
  }
  
  const { storagePath } = video;
  
  if (!storagePath) {
    return res.status(404).json({
    success: false,
    message: 'Video file does not exist',
    });
  }
  
  // stream the video file to the client
  const stat = fs.statSync(storagePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
    const chunksize = (end-start)+1;
    const file = fs.createReadStream(storagePath, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(storagePath).pipe(res);
    }
  });
    
// start the server
if (stage == "DEV") {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    });
} else if (stage == "PROD") {

  const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('Server started on port 443');
  });
}