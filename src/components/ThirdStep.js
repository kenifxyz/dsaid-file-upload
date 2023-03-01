import { useRef, useState, useEffect } from 'react';
import { Typography, TextField, Button, FormControl, FormLabel, InputLabel, Input, FormHelperText, Checkbox, FormControlLabel, Alert, AlertTitle, CircularProgress, LinearProgress, Box } from '@mui/material';
import axios from 'axios';

function ThirdStep(props) {
  let file_upload_endpoint = "http://127.0.0.1:8001/upload"

  // states
  const data = props.metadata;
  const [progressAvailable, setProgressAvailable] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [uploadRunning, setUploadRunning] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadResult, setUploadResult] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [uploadCancelled, setUploadCancelled] = useState(false);
  const [uploadingText, setUploadingText] = useState("Starting transfer 🚀");
  
  // refs
  const uploadRequestRef = useRef(null);
  const cancelTokenRef = useRef(null);
  const uploadTriggeredRef = useRef(false);

  // funcs
  const cancelUpload = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
      setUploadRunning(false);
      setUploadCompleted(true);
      setUploadCancelled(true);
      setUploadResult(false);
      setFailReason("Upload was cancelled.");
  }
  
  const uploadVideo = (file, metadata, onUploadProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', metadata.title);
    formData.append('startDateTime', metadata.startDateTime);
    formData.append('location', metadata.location);
    formData.append('termsChecked', metadata.termsChecked);
  
    cancelTokenRef.current = axios.CancelToken.source();
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress,
      cancelToken: cancelTokenRef.current.token
    };

    uploadRequestRef.current = axios.post(file_upload_endpoint, formData, config);
  
    return uploadRequestRef.current.then(response => {
        // console.log(response);
        setUploadRunning(false)
        setUploadCompleted(true)
        setUploadResult(true)
        setProgressValue(100);
        // do something with the response data
      })
      .catch(error => {
        if (axios.isCancel(error)) {
          console.log("Upload cancelled");
        } else {
          setUploadRunning(false)
          setUploadCompleted(true)
          setUploadResult(false)
          console.log(error)
          if (error.response) {
            if (error.response.status == 400 && error.response.data.message) {
              setFailReason(error.response.data.message)
            } else if (error.response.status == 500 && error.response.data) {
              let errorHtml = error.response.data;
              setFailReason(error.response.data.split("<pre>")[1].split("</pre>")[0])
            }
          } else {
            // console.log("Upload Failed", error.stack);
            setFailReason(error.message)
          }
          // handle the error
        }
      });
  };

  const handleUpload = () => {
    console.log("starting upload")
    const onUploadProgress = (progressEvent) => {
      // console.log(progressEvent)
      const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setProgressAvailable(true)
      setUploadRunning(true)
      setProgressValue(percentage);
      if (percentage > 20) {
        setUploadingText("Moving along..")
      } else if (percentage > 50) {
        setUploadingText("Getting closer..")
      } else if (percentage > 75) {
        setUploadingText("Hang tight, almost there!")
      } else if (percentage === 100) {
        setUploadingText("Done!")
      }
    };
  
    uploadVideo(data.selectedVideo, data, onUploadProgress);
  };
  
  // listeners
  useEffect(() => {
    if (data && !uploadRunning && !uploadCancelled && !uploadTriggeredRef.current) {
      // console.log("preparing to upload..", uploadTriggeredRef.current)
      uploadTriggeredRef.current = true;
      // console.log(data)
      // console.log("preparing to upload..", uploadTriggeredRef.current)
      setUploadRunning(true)
      handleUpload()
    }
  }, [])
  

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: "3em",
        marginBottom: "3em",
        width: "100%",
      }}>

      {
        uploadRunning &&  (
          !progressAvailable ? (
            <>
              <CircularProgress />
              <Typography variant="h6" sx={{ mt: 4 }}>
                Starting Upload..
              </Typography>
            </>
          ) : (
            <>
              <Box sx={{ width: '100%' }}>
                <LinearProgress variant="determinate" value={progressValue} />
              </Box>
              <Typography variant="h5" sx={{ mt: 3 }}>
                {progressValue}%
              </Typography>
              <Typography variant="h6" sx={{ mt: 0 }}>
                {uploadingText}
              </Typography>
            </>
          )
        )
      }

      { // show success/fail alerts when upload is completed
        uploadCompleted && (uploadResult ? (
          <SuccessAlert/>
        ) : (
          <FailureAlert reason={failReason}/>
        ))
      }

      </div>
    { (!uploadCompleted && uploadRunning) && (
        <Button 
        variant="outlined" 
        color="error" 
        type="submit" 
        sx={{ mt: 3, minWidth: 120 }} 
        onClick={() => {
          cancelUpload()
        }}
        >
        Cancel Upload
        </Button>
      )
    }

    {
      uploadCompleted && (
        <Button 
        variant="contained" 
        color="primary" 
        type="submit" 
        sx={{ mt: 3, minWidth: 120 }} 
        onClick={() => props.restartUpload()}
        >
        Upload Another
        </Button>
      )
    }
    </div>
  );
}

function SuccessAlert() {
  return (
    <Alert severity="success">
      <strong>Upload completed successfully!</strong>
    </Alert>
  )
}

function FailureAlert(props) {
  return (
    <Alert severity="error">
      <AlertTitle><strong>Upload Failed</strong></AlertTitle>
      <Typography>Reason: {props.reason}</Typography>
    </Alert>
  )
}



export default ThirdStep;
