import React, { useRef } from "react";
import ImageInput from "./ImageInput";
import ImageOutput from "./ImageOutput";
import DesiPix from "../assets/DesiPix.png";
import PhotoJugaad from "../assets/photojugaad.png";
import DesiPixBlue from "../assets/DesiPixBlue.png";
import { useState } from "react";
import ProgressBar from "../common/ProgressBar";
export default function HeroSection() {
  const [convertedUrl, setConvertedUrl] = useState([]);
  const [loading, setLoading] = useState("");
  const [progress, setProgress] = useState(0);
  const converterSectionRef = useRef(null);

  const handleScrollToConverter = () => {
    const offset = converterSectionRef.current.offsetTop - 100;
    window.scrollTo({ top: offset, behavior: "smooth" });
  };

  return (
    <section className="heroSection w-full pt-10 md:pt-16  px-4">
      <div className="container mx-auto px-4 flex flex-col-reverse md:flex-row items-stretch md:items-center gap-10">
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to PhotoJugaad
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Convert any image into any image extension
          </p>
          <button
            onClick={handleScrollToConverter}
            style={{ backgroundColor: "#1B2B55" }}
            className="bg-indigo-600 hover:bg-indigo-700 transition duration-200 text-white px-6 py-2 rounded shadow-md cursor-pointer"
          >
            Get Started
          </button>
        </div>

        <div className="w-full md:w-1/2">
          <img
            src={PhotoJugaad}
            alt="Hero"
            className="w-full max-w-lg mx-auto"
          />
        </div>
      </div>

      <div
        ref={converterSectionRef}
        className="relative mx-auto w-full px-4 md:px-8 mt-28 flex flex-col md:flex-row gap-y-8 md:gap-6 items-stretch bg-white/40 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-200"
      >
        <div className="absolute top-0 left-0 w-full rounded-xxl p-1">
          {progress > 0 && <ProgressBar progress={progress} />}
        </div>

        <ImageInput
          setConvertedUrl={setConvertedUrl}
          setLoading={setLoading}
          loading={loading}
          setProgress={setProgress}
        />
        <ImageOutput convertedUrl={convertedUrl} loading={loading} />
      </div>
    </section>
  );
}
