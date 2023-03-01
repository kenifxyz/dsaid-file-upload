import { useRef, useState, useEffect } from 'react';
import { Typography, TextField, Button, FormControl, FormLabel, InputLabel, Input, FormHelperText, Checkbox, FormControlLabel, Alert, AlertTitle, CircularProgress, LinearProgress, Box } from '@mui/material';

function ThirdStep(props) {
  // states
  const [progressAvailable, setProgressAvailable] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [uploadRunning, setUploadRunning] = useState(true);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadResult, setUploadResult] = useState(false);
  const [failReason, setFailReason] = useState("");
  
  // refs

  // funcs

  // listeners

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
                Uploading..
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
