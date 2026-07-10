import { useEffect, useState } from 'react';

export default function Featured() {
  const [content, setContent] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/movies/random')
      .then(res => res.json())
      .then(data => setContent(data));
  }, []);

  return (
    <div className="relative h-[85vh] text-white bg-black">
      <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover opacity-60" />
      <div className="absolute bottom-[20%] left-12 max-w-xl">
        <h1 className="text-5xl font-bold mb-4">{content.title}</h1>
        <p className="text-lg mb-6">{content.description}</p>
        <div className="flex gap-4">
          <button className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-opacity-80">▶ Play</button>
          <button className="bg-gray-500 bg-opacity-60 text-white px-6 py-2 rounded font-semibold hover:bg-opacity-40">ℹ More Info</button>
        </div>
      </div>
    </div>
  );
}