'use client';

import { useMemo, useState } from 'react';

const people = [
  { id: 1, name: 'Aren', age: 24, place: 'North Valley', mood: 'Focused', doing: 'Gathering water', hunger: 42, energy: 68 },
  { id: 2, name: 'Mira', age: 31, place: 'River Edge', mood: 'Calm', doing: 'Preparing food', hunger: 28, energy: 74 },
  { id: 3, name: 'Kian', age: 19, place: 'Origin Camp', mood: 'Curious', doing: 'Exploring', hunger: 55, energy: 61 },
  { id: 4, name: 'Tara', age: 27, place: 'East Ridge', mood: 'Tired', doing: 'Resting', hunger: 37, energy: 23 }
];

export default function AdminPage() {
  const [selectedId, setSelectedId] = useState(1);
  const selected = useMemo(() => people.find((p) => p.id === selectedId), [selectedId]);

  return (
    <main className="adminShell">
      <div className="adminTop"><div><span>LIVE EARTH / ADMIN</span><h1>Simulation monitor</h1></div><a href="/">Back to universe</a></div>
      <div className="adminGrid">
        <div className="adminPanel"><span>POPULATION</span><strong>100</strong></div>
        <div className="adminPanel"><span>WORLD DAY</span><strong>30</strong></div>
        <div className="adminPanel"><span>ALIVE</span><strong>100</strong></div>
      </div>
      <section className="adminColumns">
        <div className="adminPanel">
          <h2>People</h2>
          {people.map((person) => <button className="adminPerson" key={person.id} onClick={() => setSelectedId(person.id)}>{person.name} · {person.doing}</button>)}
        </div>
        <div className="adminPanel"><h2>{selected.name}</h2><p>{selected.place}</p><p>Mood: {selected.mood}</p><p>Hunger: {selected.hunger}%</p><p>Energy: {selected.energy}%</p></div>
      </section>
      <p className="adminNote">Developer monitor only. Current values are prototype data until the persistent engine is connected.</p>
    </main>
  );
}
