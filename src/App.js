import logo from './logo.svg';
import './App.css';
import { Grid, Paper, Box, Typography, Link, Breadcrumbs, Divider, Button } from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import axios from 'axios';
import FirstStep from './components/FirstStep';
import SecondStep from './components/SecondStep';
import ThirdStep from './components/ThirdStep';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [breadcrumbs, setBreadcrumbs] = useState([
    <Typography key="2" color="text.secondary">
      Video Details
    </Typography>,
  ]);
  let defaultMetadata = {
    selectedVideo: "",
    thumbnailUrl: "",
    thumbnailData: "",
    title: "",
    startDateTime: "",
    location: "",
    termsChecked: false,
  }
  const [metadata, setMetadata] = useState(defaultMetadata);
  // styles
  const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'left',
    color: theme.palette.text.secondary,
    width: "60%",
    padding: theme.spacing(4),
    borderRadius: '1rem',
    margin: '1rem',
    // lineHeight: '60px',
  }));

  // funcs
  const submitFirstStep = (data) => {
    // save data to state
    setMetadata((prevState) => ({ ...prevState, ...data }));
    // move to next step
    setCurrentStep(2);
  };

  const submitSecondStep = (data) => {
    // save data to state
    setMetadata((prevState) => ({ ...prevState, ...data }));
    // move to next step
    setCurrentStep(3);
  };

  const updateMetadata = (data) => {
    setMetadata((prevState) => ({ ...prevState, ...data }));
  }

  const restartUpload = () => {
    // reset metadata
    setMetadata(defaultMetadata);
    setCurrentStep(1);
  }

  // effects
  useEffect(() => {
    // update breadcrumbs
    if (currentStep == 1) {
      setBreadcrumbs([
        <Typography key="1" color="text.primary">
          Video Details
        </Typography>
      ]);
    } else if (currentStep == 2) {
      setBreadcrumbs([
        <Link key="1" onClick={() => setCurrentStep(1)}>
          Video Details
        </Link>,
        <Typography key="2" color="text.primary">
          Terms and Conditions
        </Typography>
      ]);
    } else if (currentStep == 3) {
      setBreadcrumbs([
        <Typography key="1" color="text.primary">
          Video Details
        </Typography>,
        <Typography key="2" color="text.primary">
          Terms and Conditions
        </Typography>,
        <Typography key="3" color="text.primary">
          Upload
        </Typography>
      ]);
    }
  }, [currentStep]);
  return (
    <div className="App">
      <header className="App-header">
        <Item elevation={5}>
          <Typography variant="h4" component="div" gutterBottom>
            DSAID File Upload
          </Typography>
          <Button onClick={() => setCurrentStep(2)}>Restart</Button>
          <Breadcrumbs separator="›" aria-label="breadcrumb">
            {breadcrumbs}
          </Breadcrumbs>
          <Divider style={{
            margin: "1em",
          }} />
          {
            currentStep === 1 && (
                <FirstStep
                nextStep={submitFirstStep}
                metadata={metadata}
                />
            )
          }
          {
            currentStep == 2 && (
              <SecondStep
              nextStep={submitSecondStep}
              metadata={metadata}
              updateMetadata={updateMetadata}
              />
            )
          }

          {
            currentStep == 3 && (
              <ThirdStep
              metadata={metadata}
              restartUpload={restartUpload}
              />
            )
          }
        </Item>
      </header>
    </div>
  );
}

export default App;
