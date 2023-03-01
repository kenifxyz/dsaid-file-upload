import { useRef, useState, useEffect } from 'react';
import { Typography, TextField, Button, FormControl, FormLabel, InputLabel, Input, FormHelperText } from '@mui/material';
import VideoImageThumbnail from 'react-video-thumbnail-image';

function FirstStep(props) {
  // states
  const [data, setData] = useState({
    selectedVideo: props.metadata.selectedVideo ? props.metadata.selectedVideo : "",
    thumbnailUrl: props.metadata.thumbnailUrl ? props.metadata.thumbnailUrl : "",
    thumbnailData: props.metadata.thumbnailData ? props.metadata.thumbnailData : "",
    title: props.metadata.title ? props.metadata.title : "",
    startDateTime: props.metadata.startDateTime ? props.metadata.startDateTime : "",
    location: props.metadata.location ? props.metadata.location : "",
  });
  const [selectedVideo, setSelectedVideo] = useState(props.metadata.selectedVideo ? props.metadata.selectedVideo : null);
  const [thumbnailUrl, setThumbnailUrl] = useState(props.metadata.thumbnailUrl ? props.metadata.thumbnailUrl : "");
  const [thumbnailData, setThumbnailData] = useState(props.metadata.thumbnailData ? props.metadata.thumbnailData : "");
  const [submissionFailed, setSubmissionFailed] = useState({
    file: false,
    title: false,
    date: false,
  });
  
  // refs
  const fileInputRef = useRef();

  // funcs
  const onVideoSelect = (video) => {
    setSelectedVideo(video);
    setThumbnailUrl(URL.createObjectURL(video));
  };
  
  const handleFileChange = (event) => {
    onVideoSelect(event.target.files[0]);
  };
  
  const handleAttachButtonClick = (event) => { // a bit janky, but using this to apply material ui on the "choose file" button
    fileInputRef.current.click();
  };

  const validateVideoTitle = (title) => {
    // validation logic for video title
    if (title && title.length > 0) {
      setSubmissionFailed((prevState) => ({ ...prevState, title: false }));
      return true;
    }
    setSubmissionFailed((prevState) => ({ ...prevState, title: true }));
    return false;
    
  };

  const validateVideoStartDateTime = (dateTime) => {
    // validation logic for video start date time
    if (dateTime && dateTime.length > 0) {
      setSubmissionFailed((prevState) => ({ ...prevState, date: false }));
      return true;
    }
    setSubmissionFailed((prevState) => ({ ...prevState, date: true }));
    return false;

  };

  const validateVideoFile = (file) => {
    // validation logic for video file
    if (file) {
      const fileExtension = file.name.split('.').pop();
      // console.log(fileExtension)
      if (fileExtension === "mp4" || fileExtension === "mov") { // validate file extensions
        setSubmissionFailed((prevState) => ({ ...prevState, file: false }));
        // console.log("debug: validate file ok")
        return true;
      }
    }
    // console.log("debug: validate file failed")
    setSubmissionFailed((prevState) => ({ ...prevState, file: true }));
    return false;
  };

  const handleSubmit = (e) => {
    // receive event from form and parse it
    e.preventDefault();
    let form = e.target;
    let formData = new FormData(form);
    // get values from form
    const videoTitle = formData.get("titleInput");
    const videoStartDateTime = formData.get("startDateTimeInput");
    const videoLocation = formData.get("locationInput");
    const videoFile = selectedVideo;
    const isTitleValid = validateVideoTitle(videoTitle);
    const isStartDateTimeValid = validateVideoStartDateTime(videoStartDateTime);
    const isFileValid = validateVideoFile(videoFile);
    if (isTitleValid && isStartDateTimeValid && isFileValid) {
      props.nextStep({
        selectedVideo: selectedVideo,
        thumbnailUrl: thumbnailUrl,
        thumbnailData: thumbnailData,
        title: videoTitle,
        startDateTime: videoStartDateTime,
        location: videoLocation,
      });
    }
  };

  // listeners
  useEffect(() => {
    if (selectedVideo && selectedVideo != "") {
      // console.log("debug: entered sync file effect")
      const f = new File([selectedVideo], selectedVideo.name, { type: selectedVideo.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(f);
      fileInputRef.files = dataTransfer.files;
      validateVideoFile(selectedVideo);
    }
  }, []);

  return (
    <form onSubmit={(e) => handleSubmit(e)} style={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      
      {thumbnailUrl != "" && (
        <div style={{ 
          margin: "1em",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <Typography variant="body1">
            Video Thumbnail Preview
          </Typography>
          <div style={{
            // hide the thumbnail generator component
            position: "absolute",
            zIndex: -1,
          }}>
          <VideoImageThumbnail
            videoUrl={thumbnailUrl}
            renderThumbnailHtml={false}
            thumbnailHandler={(thumbnail) => setThumbnailData(thumbnail)}
            />
          </div>
          {
            thumbnailData != "" && (
              <img src={thumbnailData} alt="Video Thumbnail" style={{
                width: "60%",
                height: "auto",
                borderRadius: "1.5em",
              }}/>
            )
          }
        </div>
      )}
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <input
          type="file"
          id="fileInput"
          name="fileInput"
          accept="video/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button variant="contained" color="primary" onClick={handleAttachButtonClick}>Choose File</Button>
        <FormHelperText>{selectedVideo && selectedVideo != "" ? `File Name: ${selectedVideo.name}` : 'Attach a file to get started!'}</FormHelperText>
        {submissionFailed.file && (
          <FormHelperText error={true}>Video attachment of file format "mp4" or "mov" is required.</FormHelperText>
        )}
      </FormControl>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <TextField 
          label="Title"
          id="titleInput"
          name="titleInput"
          value={data.title ? data.title : ""}
          onChange={(e) => setData({...data, title: e.target.value})}
          error={submissionFailed.title }
        />
        {submissionFailed.title && (
          <FormHelperText error={true}>Video title is required.</FormHelperText>
        )}
      </FormControl>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <FormLabel htmlFor="startDateTimeInput">
          <Typography variant="body1" component="div" gutterBottom>
            Start Date Time:
          </Typography>
        </FormLabel>
        <Input
          type="datetime-local"
          id="startDateTimeInput"
          name="startDateTimeInput"
          value={data.startDateTime ? data.startDateTime : ""}
          onChange={(e) => setData({...data, startDateTime: e.target.value})}
        />
        {submissionFailed.date && (
          <FormHelperText error={true}>Video start date time is required.</FormHelperText>
        )}
      </FormControl>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <TextField 
          label="Location"
          id="locationInput"
          name="locationInput"
          value={data.location ? data.location : ""}
          onChange={(e) => setData({...data, location: e.target.value})}
        />
      </FormControl>
      
      <Button variant="contained" color="primary" type="submit" sx={{ m: 3, minWidth: 120 }}>Next Step</Button>
    </form>
  );
}

export default FirstStep;
