export const trackVolume = (
  audioTrack: MediaStreamTrack,
  callback: (volume: number) => void
) => {
  const mediaStream = new MediaStream();
  mediaStream.addTrack(audioTrack);

  const audioContext = new AudioContext();
  const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
  const processor = audioContext.createScriptProcessor(2048, 1, 1);

  mediaStreamSource.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);

    const total = inputData.reduce((a, b) => a + Math.abs(b));
    const rms = Math.sqrt(total / inputData.length);
    callback(rms);
  };
};
