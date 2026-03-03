import React from 'react';
import { FaIcons, FaCut, FaImage } from 'react-icons/fa';

export default function FeaturesSection() {
  const features = [
    {
      icon: <FaIcons className="text-4xl text-indigo-900 mb-4" />,
      title: "Image to Favicon",
      description: "Easily convert your image into a browser favicon in seconds.",
    },
    {
      icon: <FaCut className="text-4xl text-indigo-900 mb-4" />,
      title: "Background Remover",
      description: "Automatically remove image backgrounds with AI precision.",
    },
    {
      icon: <FaImage className="text-4xl text-indigo-900 mb-4" />,
      title: "Format Converter",
      description: "Convert between JPG, PNG, WebP, and more instantly.",
    },
  ];

  return (
    <section className="mt-5 w-full py-16 px-4 md:px-8 bg-white/40 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Powerful Tools at Your Fingertips
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 p-6 cursor-pointer"
            >
              {feature.icon}
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
