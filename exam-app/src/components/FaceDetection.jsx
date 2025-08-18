import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import { useEffect, useRef } from "react";
import socket from "../utils/socket";

const FaceDetection = ({ onWarning }) => {
  const videoRef = useRef(null);
  const modelRef = useRef(null); // ✅ store model here

  useEffect(() => {
    const loadModelAndStart = async () => {
      try {
        modelRef.current = await blazeface.load();
        console.log("✅ BlazeFace model loaded");
        await setupCamera();
        console.log("✅ Camera started");
        detectLoop();
      } catch (err) {
        console.error("❌ Error loading model:", err);
      }
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
      }
    };

    const detectLoop = () => {
      const detectFace = async () => {
        if (
          videoRef.current &&
          videoRef.current.readyState === 4 &&
          videoRef.current.videoWidth > 0 &&
          modelRef.current
        ) {
          const predictions = await modelRef.current.estimateFaces(videoRef.current, false);

          if (
            !predictions.length ||
            (predictions[0].probability && predictions[0].probability < 0.6)
          ) {
            socket.emit("suspicious_event", {
              type: "face_not_visible",
              timestamp: new Date().toISOString(),
            });
            if (onWarning) onWarning("face_not_visible");
          }
        }
        requestAnimationFrame(detectFace);
      };

      detectFace();
    };

    loadModelAndStart();

    // ✅ cleanup
    const videoEl = videoRef.current; // capture current ref
    return () => {
      const stream = videoEl?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onWarning]);

  return (
    <div style={{ position: "absolute", top: "20px", right: "20px" }}>
      <video
        ref={videoRef}
        width="200"
        height="150"
        autoPlay
        playsInline
        muted
        style={{
          border: "2px solid #007bff",
          borderRadius: "8px",
          background: "#000",
        }}
      />
    </div>
  );
};

export default FaceDetection;
