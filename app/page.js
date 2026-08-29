'use client';

import { useMemo, useState } from 'react';

const people = [
  { id: 1, name: 'Aren', age: 24, place: 'North Valley', mood: 'Focused', doing: 'Gathering water', hunger: 42, energy: 68 },
  { id: 2, name: 'Mira', age: 31, place: 'River Edge', mood: 'Calm', doing: 'Preparing food', hunger: 28, energy: 74 },
  { id: 3, name: 'Kian', age: 19, place: 'Origin Camp', mood: 'Curious', doing: 'Exploring', hunger: 55, energy: 61 },
  { id: 4, name: 'Tara', age: 27, place: 'East Ridge', mood: 'Tired', doing: 'Resting', hunger: 37, energy: 23 }
];

const events = [
  'Aren found fresh water near North Valley.',
  'Mira shared food with another person.',
  'Kian moved beyond the known camp boundary.',
  'Tara stopped to recover energy.',
  'Wild food supply changed after gathering activity.'
];

export default function HomePage() {
  const [selectedId, setSelectedId] = useState(1);
  const selected = useMemo(() => people.find((p) => p.id === selectedId), [selectedId]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">LIVE EARTH / OBSERVER V0.1</div>
          <h1>A world that keeps living.</h1>
        </div>
        <div className="liveBadge"><span /> LIVE</div>
      </header>

      <section className="statsGrid">
        <Stat label="Population" value="100" />
        <Stat label="World Day" value="30" />
        <Stat label="Alive" value="100" />
        <Stat label="Events" value="72,000+" />
      </section>

      <section className="worldCard">
        <div className="worldGlow" />
        <div className="worldLabel">
          <span>WORLD 001</span>
          <strong>Origin</strong>
          <small>Seed 1 · Autonomous simulation</small>
        </div>
        <div className="orbit orbitOne" />
        <div className="orbit orbitTwo" />
        <div className="planet">
          <div className="land landA" />
          <div className="land landB" />
          <div className="land landC" />
        </div>
      </section>

      <section className="contentGrid">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">PEOPLE</span>
              <h2>Lives continuing now</h2>
            </div>
          </div>
          <div className="peopleList">
            {people.map((person) => (
              <button
                key={person.id}
                className={`personRow ${selectedId === person.id ? 'active' : ''}`}
                onClick={() => setSelectedId(person.id)}
              >
                <div className="avatar">{person.name[0]}</div>
                <div className="personText">
                  <strong>{person.name}, {person.age}</strong>
                  <span>{person.doing} · {person.place}</span>
                </div>
                <span className="statusDot" />
              </button>
            ))}
          </div>
        </div>

        <div className="panel detailPanel">
          <span className="eyebrow">SELECTED PERSON</span>
          <h2>{selected.name}</h2>
          <p className="muted">Age {selected.age} · {selected.place}</p>

          <div className="detailRows">
            <Detail label="Current action" value={selected.doing} />
            <Detail label="Mood" value={selected.mood} />
            <Detail label="Hunger" value={`${selected.hunger}%`} />
            <Detail label="Energy" value={`${selected.energy}%`} />
          </div>

          <div className="thoughtBox">
            <span>PRIVATE INNER STATE</span>
            <p>Decisions are caused by body state, memory, resources and personality — not by a scripted storyline.</p>
          </div>
        </div>

        <div className="panel feedPanel">
          <span className="eyebrow">WORLD HISTORY</span>
          <h2>Recent events</h2>
          <div className="feed">
            {events.map((event, index) => (
              <div className="event" key={event}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        Prototype observer. Persistent simulation engine is being connected next.
      </footer>
    </main>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function Detail({ label, value }) {
  return <div className="detail"><span>{label}</span><strong>{value}</strong></div>;
}
