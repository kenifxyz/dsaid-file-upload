const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // to reduce file upload collisions

dotenv.config();

const app = express();
app.use(cors());
// app.use(cors({
//   origin: 'https://dsaid-file-upload.netlify.app'
// }));

const port = process.env.PORT || 8080;

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

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
}, {
  timestamps: true, // disable timestamps (createdAt, updatedAt)
});
sequelize.sync();

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

  // create a new Video instance with the metadata and filename
  const newVideo = await Video.create({
    title,
    location: location || null,
    start_time: new Date(startDateTime),
    filename: req.file.originalname,
    storagePath: null
  });

  // get the Id of the newly created Video instance
  const videoId = newVideo.id;

  const storagePath = `uploads/${videoId}.${file.originalname.split('.').pop()}`;
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

  readStream.on('end', () => {
    res.write('data: 100\n\n');
    res.status(200).json({
      success: true,
      message: `Video uploaded with ID ${newVideo.id}`,
    });
    res.end();
  });

  // set up the SSE response headers
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();
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
    
// start the server
app.listen(port, () => {
console.log(`App listening at http://localhost:${port}`);
});