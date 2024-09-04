import React, { useEffect } from 'react';
import { useState } from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}


function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}





function App(){
  const [location,setLocation] = useState(() => {
    return localStorage.getItem('location') || '';
  });
  const [isLoading,setIsLoading] = useState(false);
  const [displayLocation,setDisplayLocation] = useState('');
  const [weather,setWeather] = useState({});

   async function fetchWeather(){
    if(location.length < 2) return;
    try {
      setIsLoading(true);
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);
      
      if (!geoData.results) throw new Error("Location not found");
      
      const { latitude, longitude, timezone, name, country_code } =
      geoData.results.at(0);
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);
      
      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      console.error(err);
    }
    finally{
      setIsLoading(false);
    }
  }
  useEffect(() => {
      fetchWeather();
      localStorage.setItem("location", location);
  }, [location]);
  

  return(
    <div className='app'>
      <h1>Weather Go</h1>
      <div>
        <input type='text' placeholder='Search for Location...' value={location} onChange={(e) => setLocation(e.target.value)}/>
      </div>
      {isLoading && <p className='loader'>Loading...</p>}
      {!isLoading && location.length>=2 && weather.weathercode && <Weather weather={weather} location={displayLocation}/> }
      
    </div>
  );
}

export default App;

function Weather({weather,location}){
  const max = weather.temperature_2m_max;
  const min = weather.temperature_2m_min;
  const codes = weather.weathercode;
  const dates = weather.time;

  return(
    <div>
      <h2>Weather in {location}</h2>
      <ul className='weather'>
        {dates.map((date,i) => (<Day date={date} max={max.at(i)} min={min.at(i)} code={codes.at(i)} key={date} isToday={i === 0}/>))}
      </ul>
    </div>
  )
}

const Day = ({date,max,min,code,isToday}) => {
  return(
    <li className='day'>
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? 'Today' :formatDay(date)}</p>
      <p>{Math.floor(max)}&deg; &mdash; <strong>{Math.ceil(min)}&deg;</strong> </p>
    </li>
  )
}