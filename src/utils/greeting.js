import { useState, useEffect } from 'react';

export function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "goodMorning";
  if (hour >= 12 && hour < 17) return "goodAfternoon";
  if (hour >= 17 && hour < 21) return "goodEvening";
  return "goodNight";
}

export function useGreeting() {
  const [greetingKey, setGreetingKey] = useState(getGreetingKey());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingKey(getGreetingKey());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return greetingKey;
}
