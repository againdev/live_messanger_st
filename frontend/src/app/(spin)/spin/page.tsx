"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./Wheel.module.scss";

const options = ["LOSE", "2", "5", "10", "5", "2", "LOSE", "2", "5", "10", "5", "2"];
const arc = Math.PI / (options.length / 2); // Угол сектора

const RouletteWheel: React.FC = () => {
  const [startAngle, setStartAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const easeOut = (t: number, b: number, c: number, d: number): number => {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  };

  const getColor = (index: number, total: number): string => {
    const center = 128;
    const width = 127;
    const frequency = Math.PI * 2 / total;

    const red = Math.sin(frequency * index + 2) * width + center;
    const green = Math.sin(frequency * index + 0) * width + center;
    const blue = Math.sin(frequency * index + 4) * width + center;

    return `rgb(${red}, ${green}, ${blue})`;
  };

  const drawRouletteWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outsideRadius = 200;
    const textRadius = 160;
    const insideRadius = 125;

    ctx.clearRect(0, 0, 500, 500);

    options.forEach((option, i) => {
      const currentAngle = angle + i * arc;
      ctx.fillStyle = getColor(i, options.length);

      ctx.beginPath();
      ctx.arc(250, 250, outsideRadius, currentAngle, currentAngle + arc, false);
      ctx.arc(250, 250, insideRadius, currentAngle + arc, currentAngle, true);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(
        250 + Math.cos(currentAngle + arc / 2) * textRadius,
        250 + Math.sin(currentAngle + arc / 2) * textRadius
      );
      ctx.rotate(currentAngle + arc / 2 + Math.PI / 2);
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText(option, -ctx.measureText(option).width / 2, 0);
      ctx.restore();
    });

    // Стрелка (снизу)
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(250, 250 + insideRadius - 10);
    ctx.lineTo(260, 250 + insideRadius + 10);
    ctx.lineTo(240, 250 + insideRadius + 10);
    ctx.fill();
  };

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    const spinAngleStart = Math.random() * 10 + 10;
    const spinTimeTotal = Math.random() * 3 + 8 * 1000;
    let spinTime = 0;

    const rotateWheel = () => {
      spinTime += 10;
      if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
      }

      const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
      setStartAngle((prevAngle) => prevAngle + (spinAngle * Math.PI) / 180);
      requestAnimationFrame(rotateWheel);
    };

    const stopRotateWheel = () => {
      const degrees = (startAngle * 180) / Math.PI + 90;
      const index = Math.floor((360 - (degrees % 360)) / (360 / options.length)) % options.length;
      setResult(options[index]);
      setSpinning(false);
    };

    rotateWheel();
  };

  useEffect(() => {
    drawRouletteWheel(startAngle);
  }, [startAngle]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} id="canvas" width="500" height="500"></canvas>
      <button onClick={spin} disabled={spinning} className={styles.spinButton}>
        {spinning ? "Spinning..." : "Spin"}
      </button>
      {result && <p className={styles.result}>Result: {result}</p>}
    </div>
  );
};

export default RouletteWheel;