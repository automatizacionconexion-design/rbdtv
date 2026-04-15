import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { formatInTimeZone } from 'date-fns-tz';
import { useWeather } from '../hooks/useWeather';

const TIMEZONE = 'America/Argentina/Buenos_Aires';

export const PermanentInfo: React.FC = () => {
  const [time, setTime] = useState('');
  const weather = useWeather();

  useEffect(() => {
    const updateTime = () => {
      setTime(formatInTimeZone(new Date(), TIMEZONE, 'HH:mm'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-8 right-10 z-30 pointer-events-none"
    >
      <div className="flex items-center gap-3 px-5 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 shadow-lg">
        <span className="text-white text-2xl font-bold tracking-tight">{time}</span>
        <span className="text-white/30 text-xl font-light">|</span>
        <span className="text-white text-2xl font-medium tracking-tight">{weather.temp}</span>
        <span className="text-white/30 text-xl font-light">|</span>
        <span className="text-white text-2xl font-medium tracking-tight">{weather.humidity}</span>
      </div>
    </motion.div>
  );
};
