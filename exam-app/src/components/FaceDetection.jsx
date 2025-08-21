import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import { useEffect, useRef } from "react";
import socket from "../utils/socket";

const FaceDetection = () => {
  const videoRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const loadModelAndStart = async () => {
      try {
        modelRef.current = await blazeface.load();
        await setupCamera();
        detectLoop();
      } catch (err) {
        console.error("Error loading BlazeFace:", err);
      }
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => { videoRef.current.play(); resolve(); };
        });
      }
    };

    const detectLoop = () => {
      const detectFace = async () => {
        if (videoRef.current && modelRef.current) {
          const predictions = await modelRef.current.estimateFaces(videoRef.current, false);
          if (!predictions.length || (predictions[0].probability && predictions[0].probability < 0.6)) {
            socket.emit("suspicious_event", { type: "face_not_visible", timestamp: new Date().toISOString() });
          }
        }
        requestAnimationFrame(detectFace);
      };
      detectFace();
    };

    loadModelAndStart();

    const videoEl = videoRef.current;
    return () => {
      const stream = videoEl?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline muted />
  );
};

export default FaceDetection;
