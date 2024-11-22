import Snowfall from 'react-snowfall';
import snowflake from './snowflake.png';
import { useState, useEffect } from 'react';

function SnowfallEffect() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loadImages = () => {
      const snowflakeImages = [snowflake];
      const loadedImages = snowflakeImages.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });

      let loadedCount = 0;
      loadedImages.forEach((img) => {
        img.onload = () => {
          loadedCount += 1;
          if (loadedCount === loadedImages.length) {
            setImages(loadedImages);
          }
        };
      });
    };

    loadImages();
  }, []);

  return (
    <Snowfall
      color="transparent"
      snowflakeCount={100}
      speed={[0.3, 1.0]}
      wind={[0.1, 0.3]}
      images={images}
      radius={[5, 15]}
      opacity={[0.4, 0.9]}
      rotationSpeed={[-0.5, 0.5]}
    />
  );
}

export default SnowfallEffect;
