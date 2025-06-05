import { useEffect, useState } from 'react'
import React from 'react'
import { getFullPokedexNumber } from '../utils';
import TypeCard from './TypeCard';
import Modal from './Modal';

export default function PokeCard({select, setSelect}) {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [skill, setSkill] = useState(null)
  const [loadingSkill,setLoadingSkill] = useState(false)

  const imgList = data?.sprites ? Object.keys(data.sprites).filter(val => {
    if (!data.sprites[val]) return false
    if (typeof data.sprites[val] === 'object') return false
    return true
  }) : []

  async function fetchMoveData(move, moveUrl) {
    if (loadingSkill || !localStorage || !moveUrl) return;
    
    let cache = {};
    if (localStorage.getItem('pokemon-moves')) {
      cache = JSON.parse(localStorage.getItem('pokemon-moves'));
    }
    
    if (move in cache) {
      setSkill(cache[move]);
      return;
    }

    try {
      setLoadingSkill(true);
      const response = await fetch(moveUrl);
      const moveData = await response.json();
      
      const description = moveData?.flavor_text_entries?.find(entry => 
        entry.version_group.name === "firered-leafgreen"
      )?.flavor_text;

      const skillData = {
        name: move,
        description: description || "No description available"
      };
      
      setSkill(skillData);
      cache[move] = skillData;
      localStorage.setItem('pokemon-moves', JSON.stringify(cache));
    } catch (err) {
      console.error('Error fetching move data:', err);
      setSkill({ name: move, description: "Failed to load move details" });
    } finally {
      setLoadingSkill(false);
    }
  }

  useEffect(() => {
    setError(null);
    setData(null);

    let cache = {};
    if (localStorage.getItem('pokedex')) {
      cache = JSON.parse(localStorage.getItem('pokedex'));
    }

    if (cache[select]) {
      setData(cache[select]);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const url = `https://pokeapi.co/api/v2/pokemon/${select}`;
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
        cache[select] = json;
        localStorage.setItem('pokedex', JSON.stringify(cache));
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    console.log(cache)
  }, [select]);

  return (
    <div className='poke-card'>
      {loading ? (
        <div>Loading...</div>
      ) : data ? (
        <>
        {skill && (
          <Modal handleCloseModal={() => setSkill(null)}>
            <div>
              <h6>Name</h6>
              <h2 className='skill-name'>{skill.name.replaceAll('-', ' ')}</h2>
            </div>
            <div>
              <h6>Description</h6>
              <p>{skill.description}</p>
            </div>
          </Modal>
        )}
          <div>
            <h4>#{getFullPokedexNumber(select)}</h4>
            <h2>{data.name}</h2>
          </div>
          <div className='type-container'>
            {data.types.map((typeObj, i) => {
              return(
                <TypeCard key={i} type={typeObj.type}/>
              )
            })}
          </div>
          <img 
            className='default-image' 
            src={new URL(`/pokemon/${getFullPokedexNumber(select)}.png`, window.location.origin).href}
          />
          <div className='image-container'>
            {imgList.map((spriteKey, i) => {
              const spriteUrl = data.sprites[spriteKey]
              return spriteUrl ? (
                <img 
                  key={i} 
                  src={spriteUrl} 
                  alt={`${data.name} ${spriteKey}`}
                  className="sprite-image"
                />
              ) : null
            })}
          </div>
          <h3>Stats</h3>
          <div className='stats-card'>
            {data.stats.map((statObj, i) => {
              const { stat, base_stat } = statObj;
              return (
                <div key={i} className='stat-item'>
                  <p>{stat?.name?.replaceAll('-', ' ')}</p>
                  <h4>{base_stat}</h4>
                </div>
              );
            })}
          </div>
          <h3>Moves</h3>
          <div className='pokemon-move-grid'>
            {data?.moves.map((moveObj,i)=>{
              return(
                <button className='button-card pokemon-move' key={i} onClick={()=>{fetchMoveData(moveObj.move.name,moveObj.move.url) }}>
                  <p>{moveObj?.move?.name.replaceAll('-',' ')}</p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
