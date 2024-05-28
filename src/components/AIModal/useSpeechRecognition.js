// useSpeechRecognition.js
import { useEffect } from "react";

const useSpeechRecognition = (onResult, onError) => {
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('음성 인식을 지원하지 않는 브라우저입니다.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      onResult(speechResult);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event);
      if (onError) onError(event);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [onResult, onError]);
};

export default useSpeechRecognition;
