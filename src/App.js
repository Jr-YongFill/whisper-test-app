import React, { useState } from 'react';
import './App.css';

const apiKey = process.env.REACT_APP_OPENAI_KEY;

function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const transcribeAudio = async () => {
    if (!file) {
      alert("Please select an audio file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        const errorDetail = await transcriptionResponse.json();
        throw new Error(`Error transcribing audio: ${transcriptionResponse.statusText}, ${JSON.stringify(errorDetail)}`);
      }

      const result = await transcriptionResponse.json();
      setText(`Transcription: ${result.text}`);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setText('Error transcribing audio');
    }
  };

  return (
    <div className="App">
      <h1>Whisper API Demo</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={transcribeAudio}>Transcribe Audio</button>
      <div>
        {text}
      </div>
    </div>
  );
}

export default App;
