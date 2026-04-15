import { useState, useEffect } from 'react';
import { WeatherData } from '../types';

const WEATHER_URL = 'https://wttr.in/Buenos+Aires?format=j1';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({ temp: '--', humidity: '--' });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(WEATHER_URL);
        const data = await response.json();
        const current = data.current_condition[0];
        setWeather({
          temp: `${current.temp_C}°C`,
          humidity: `${current.humidity}%`,
        });
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1000 * 60 * 10); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);

  return weather;
}
