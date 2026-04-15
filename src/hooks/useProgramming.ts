import { useState, useEffect } from 'react';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { Program } from '../types';

const PROGRA_URL = '/api/programming';
const TIMEZONE = 'America/Argentina/Buenos_Aires';

const DAY_MAP: { [key: string]: number } = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6
};

export function useProgramming() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [currentProgram, setCurrentProgram] = useState<string>('RBD RADIO');

  useEffect(() => {
    const fetchProgra = async () => {
      try {
        const response = await fetch(PROGRA_URL);
        const data = await response.json();
        
        if (data && data.schedule) {
          // Sort schedule by day and time to make end-time calculation easier
          const sorted = [...data.schedule].sort((a, b) => {
            const dayDiff = DAY_MAP[a.day] - DAY_MAP[b.day];
            if (dayDiff !== 0) return dayDiff;
            return a.start.localeCompare(b.start);
          });
          setSchedule(sorted);
        }
      } catch (error) {
        console.error('Error fetching programming:', error);
      }
    };

    fetchProgra();
    const interval = setInterval(fetchProgra, 1000 * 60 * 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCurrentProgram = () => {
      const now = new Date();
      const timeStr = formatInTimeZone(now, TIMEZONE, 'HH:mm');
      const [nowH, nowM] = timeStr.split(':').map(Number);
      const nowTime = nowH * 60 + nowM;

      const dayStrISO = formatInTimeZone(now, TIMEZONE, 'i');
      let dayNum = parseInt(dayStrISO);
      if (dayNum === 7) dayNum = 0;

      // Filter programs for today
      const todayPrograms = schedule.filter(p => DAY_MAP[p.day] === dayNum);
      
      if (todayPrograms.length === 0) {
        setCurrentProgram('RBD RADIO');
        return;
      }

      // Find the program that is currently running
      // Since there's no "end" time, we assume it lasts until the next one starts
      let found = null;
      for (let i = 0; i < todayPrograms.length; i++) {
        const p = todayPrograms[i];
        const [startH, startM] = p.start.split(':').map(Number);
        const startTime = startH * 60 + startM;
        
        const nextP = todayPrograms[i + 1];
        let endTime = 24 * 60; // Default to end of day
        
        if (nextP) {
          const [nextH, nextM] = nextP.start.split(':').map(Number);
          endTime = nextH * 60 + nextM;
        }

        if (nowTime >= startTime && nowTime < endTime) {
          found = p;
          break;
        }
      }

      if (found) {
        setCurrentProgram(found.program);
      } else {
        // Check if it's before the first program of the day
        const firstP = todayPrograms[0];
        const [firstH, firstM] = firstP.start.split(':').map(Number);
        const firstTime = firstH * 60 + firstM;
        
        if (nowTime < firstTime) {
          // It's early morning, might be a program from yesterday late night
          // But based on the JSON, we'll just show default for now
          setCurrentProgram('RBD RADIO');
        } else {
          setCurrentProgram('RBD RADIO');
        }
      }
    };

    updateCurrentProgram();
    const interval = setInterval(updateCurrentProgram, 1000 * 60);
    return () => clearInterval(interval);
  }, [schedule]);

  return currentProgram;
}
