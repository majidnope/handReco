
import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, GestureRecognizer } from "@mediapipe/tasks-vision"
import Webcam from 'react-webcam'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
const App = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [lastVideoTime, setLastVideoTime] = useState(-1)
  const [ai, setAi] = useState(null)
  const [handPos, setPos] = useState("")
  useEffect(() => {

    if (videoRef.current.video) {
      const load = async () => {
        const vision = await FilesetResolver.forVisionTasks(
          // path/to/wasm/root
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await GestureRecognizer.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "/gesture_recognizer.task"
            },
            runningMode: "VIDEO",

            numHands: 2
          });
        setAi(handLandmarker)


      }
      load()
    }
  }, [videoRef.current?.video])

  useEffect(() => {
    if (ai) {

      async function renderLoop() {
        const video = videoRef.current.video
        let canvas = canvasRef.current.getContext("2d")

        canvas.canvas.width = video.videoWidth
        canvas.canvas.height = video.videoHeight

        canvas.save();
        canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
        if (video.currentTime !== lastVideoTime) {
          let startTimeMs = performance.now();
          const detections = await ai.recognizeForVideo(video, startTimeMs);
          if (detections?.gestures[0]?.length > 0) {
            setPos(detections?.gestures[0][0]?.displayName + " " + detections?.gestures[0][0]?.categoryName)
          }
          let cor = detections.landmarks[0]?.map(({ x, y }) => ({ x, y }))

          drawConnectors(canvas, cor, GestureRecognizer.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          })
          drawLandmarks(canvas, cor, { color: "#FF0000", lineWidth: 2 })
          setLastVideoTime(video.currentTime)
        }
        canvas.restore();

        requestAnimationFrame(() => {
          renderLoop();
        });
      }
      renderLoop()
    }
  }, [ai])



  return (
    <>
      <Webcam ref={videoRef} />
      <canvas style={{ position: "absolute", left: 0, right: 0 }} ref={canvasRef}></canvas>
      <h4>{handPos}</h4>
    </>
  )
};
export default App;