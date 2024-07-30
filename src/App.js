import React, { useState, useEffect } from 'react';

const apiKey = process.env.REACT_APP_OPENAI_KEY;


function App() {
  const [recorder, setRecorder] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);

  const ask = 'Web Server와 Web Application Server의 차이점에 대해서 설명해주세요.';

  const downloadRecording = () => {
    const url = window.URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = '녹음 파일';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  const askQuestion = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: 'user',
            content: `당신은 개발자 면접관이며, 다음 질문에 대해 면접자가 제대로 답변했는지 체크해야합니다.\n입력형식은 다음과 같습니다.\n면접 질문:  {질문 텍스트}\n면접 답변:  {답변 텍스트}\n해당 면접 질문에 대해 면접 답변이 정답인지, 틀렸다면 어느 부분이 틀렸는지 답변해주세요. 코드는 출력하지 않습니다.\n그리고 어느 부분이 틀린지 지적해주세요.\n 면접질문: ${ask} 면접답변: ${text}`
          }],
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error in AI response: ${response.statusText}, ${JSON.stringify(errorDetail)}`);
      }

      const result = await response.json();
      setQuestion(`Answer: ${result.choices[0].message.content}`);
    } catch (error) {
      console.error('Error generating question or getting response from AI:', error);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      alert("Please select an audio file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.m4a');
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
      await askQuestion();
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  useEffect(() => {
    async function getMicrophoneAccess() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream); // m4a로 저장하기 위해 mimeType 설정
      let audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setAudioURL(audioUrl);
        setAudioBlob(blob);
        audioChunks = [];
      });

      setRecorder(mediaRecorder);
    }

    getMicrophoneAccess();
  }, []);

  const startRecording = () => {
    if (recorder && recorder.state === 'inactive') {
      recorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      <div>{ask}</div>
      <button onClick={startRecording} disabled={recording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>
      <button onClick={downloadRecording} disabled={!audioBlob}>Dwonload</button>
      {audioURL && <audio src={audioURL} controls />}
      {audioURL && <button onClick={transcribeAudio}>변환</button>}
      {text && <div>{text}</div>}
      {question && <hr></hr>}
      {question && <div>{question}</div>}
    </div >

  );
}

export default App;
