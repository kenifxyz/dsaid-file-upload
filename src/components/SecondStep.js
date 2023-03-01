import { useRef, useState, useEffect } from 'react';
import { Typography, TextField, Button, FormControl, FormLabel, InputLabel, Input, FormHelperText, Checkbox, FormControlLabel } from '@mui/material';

function SecondStep(props) {
  let terms = `By using this service, you agree to the following terms and conditions. You may upload videos with metadata such as title, start date time, and location, but must have the necessary rights to do so and ensure the video doesn't infringe on third-party rights. Metadata collected may be used for analytical purposes. By uploading a video, you grant us a non-exclusive, worldwide, royalty-free license to use and display it on our platform. We will make reasonable efforts to keep your information secure, but cannot guarantee absolute security.`
  // states
  const [data, setData] = useState({
    termsChecked: props.metadata.termsChecked ? props.metadata.termsChecked : false,
  });
  
  // refs

  // funcs

  const handleSubmit = (e) => {
    // receive event from form and parse it
    e.preventDefault();
    let form = e.target;
    let formData = new FormData(form);
    // get values from form
    const formAgree = formData.get("agree");
    if (formAgree) {
      props.nextStep({
        termsChecked: true,
      });
    } else {
      alert("You must agree to the terms and conditions to continue.")
    }
  };

  // listeners

  return (
    <form onSubmit={(e) => handleSubmit(e)} style={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      
      <TextField
        multiline
        rows={9}
        variant="outlined"
        fullWidth
        value={terms}
        disabled
      />
      
      <FormControlLabel
        control={<Checkbox 
        checked={data.termsChecked} 
        name="agree"
        onChange={(e) => {
          let currentState = data.termsChecked
          setData((prevState) => ({ ...prevState, termsChecked: !currentState }));
          props.updateMetadata({
            termsChecked: !currentState,
          });
        }} />}
        label="I agree to the terms and conditions"
      />

      <Button variant="contained" color="success" type="submit" sx={{ mt: 3, minWidth: 120 }} disabled={!data.termsChecked}>Start Upload</Button>
    </form>
  );
}

export default SecondStep;
