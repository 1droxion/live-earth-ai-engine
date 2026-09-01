import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const WORLD_FILE = path.join(DATA_DIR, 'world.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.ndjson');

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const daysToRun = Number(arg('days', '30'));
const seedArg = Number(arg('seed', '26071999'));
const reset = process.argv.includes('--reset');
const TICKS_PER_DAY = 4;
const DAYS_PER_TICK = 1 / TICKS_PER_DAY;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const firstNames = [
  'Ari', 'Maya', 'Noah', 'Lena', 'Ishan', 'Nora', 'Kai', 'Mira', 'Eli', 'Sara',
  'Owen', 'Anya', 'Leo', 'Zara', 'Ravi', 'Ivy', 'Theo', 'Nia', 'Arun', 'Eva',
  'Milan', 'Sana', 'Jonah', 'Rhea', 'Ezra', 'Tara', 'Niko', 'Asha', 'Liam', 'Meera'
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function rounded(value, places = 2) {
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function ageYears(agent) {
  return agent.ageDays / 365;
}

function isAdult(agent) {
  return ageYears(agent) >= 18;
}

function aliveAgents(world) {
  return world.agents.filter((agent) => agent.alive);
}

function makeAgent(world, rand, index, options = {}) {
  const sex = options.sex ?? (rand() < 0.5 ? 'female' : 'male');
  const age = options.ageYears ?? (18 + Math.floor(rand() * 28));
  const name = options.name ?? `${firstNames[index % firstNames.length]}-${String(world.nextAgentId).padStart(3, '0')}`;
  const agent = {
    id: `P${String(world.nextAgentId++).padStart(6, '0')}`,
    name,
    sex,
    ageDays: Math.round(age * 365),
    alive: true,
    health: 90 + rand() * 10,
    hunger: 20 + rand() * 25,
    energy: 60 + rand() * 35,
    social: 50 + rand() * 35,
    food: 2 + Math.floor(rand() * 4),
    credits: 20 + Math.floor(rand() * 31),
    partnerId: null,
    pregnancyDaysLeft: null,
    parents: options.parents ?? [],
    children: [],
    affinity: {},
    memories: [],
    traits: {
      sociability: rounded(rand()),
      diligence: rounded(rand()),
      curiosity: rounded(rand()),
      resilience: rounded(rand())
    }
  };
  world.agents.push(agent);
  return agent;
}

function createWorld(seed) {
  const rand = mulberry32(seed);
  const world = {
    version: 1,
    seed,
    rngCalls: 0,
    day: 0,
    tick: 0,
    nextAgentId: 1,
    nextEventId: 1,
    ecosystem: { wildFood: 900, carryingCapacity: 1500, regenerationPerDay: 22 },
    settlement: { communalFood: 180, treasury: 1000 },
    agents: []
  };
  for (let i = 0; i < 25; i += 1) makeAgent(world, rand, i);
  return world;
}

function restoreRandom(world) {
  const rand = mulberry32(world.seed);
  for (let i = 0; i < (world.rngCalls || 0); i += 1) rand();
  return () => {
    world.rngCalls = (world.rngCalls || 0) + 1;
    return rand();
  };
}

function ensureFiles(resetWorld) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (resetWorld) {
    if (fs.existsSync(WORLD_FILE)) fs.unlinkSync(WORLD_FILE);
    if (fs.existsSync(EVENTS_FILE)) fs.unlinkSync(EVENTS_FILE);
  }
}

function loadWorld(seed) {
  if (!fs.existsSync(WORLD_FILE)) return createWorld(seed);
  return JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8'));
}

function saveWorld(world) {
  const temp = `${WORLD_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(world, null, 2));
  fs.renameSync(temp, WORLD_FILE);
}

let currentDay = 0;
function remember(agent, text, importance = 0.5) {
  if (!agent) return;
  agent.memories.push({ day: rounded(currentDay), text, importance: rounded(importance) });
  if (agent.memories.length > 40) {
    agent.memories.sort((a, b) => b.importance - a.importance || b.day - a.day);
    agent.memories = agent.memories.slice(0, 30).sort((a, b) => a.day - b.day);
  }
}

function emit(world, type, data = {}, importance = 0.5) {
  const event = {
    id: `E${String(world.nextEventId++).padStart(8, '0')}`,
    day: rounded(world.day),
    type,
    importance: rounded(importance),
    data
  };
  fs.appendFileSync(EVENTS_FILE, `${JSON.stringify(event)}\n`);
  return event;
}

function getAgent(world, id) {
  return world.agents.find((agent) => agent.id === id) ?? null;
}

function chooseOther(world, rand, agent, adultOnly = false) {
  const candidates = aliveAgents(world).filter((other) => other.id !== agent.id && (!adultOnly || isAdult(other)));
  return candidates.length ? candidates[Math.floor(rand() * candidates.length)] : null;
}

function actEat(world, agent) {
  if (agent.food > 0) {
    agent.food -= 1;
    agent.hunger = clamp(agent.hunger - 48);
    return 'ate stored food';
  }
  if (world.settlement.communalFood > 0) {
    world.settlement.communalFood -= 1;
    agent.hunger = clamp(agent.hunger - 42);
    return 'ate communal food';
  }
  return null;
}

function actForage(world, rand, agent) {
  if (world.ecosystem.wildFood <= 0) return 'searched for food but found none';
  const skill = 0.35 + 0.35 * agent.traits.resilience + 0.3 * agent.traits.curiosity;
  if (rand() < skill) {
    const found = 1 + (rand() < 0.25 ? 1 : 0);
    const actual = Math.min(found, world.ecosystem.wildFood);
    world.ecosystem.wildFood -= actual;
    agent.food += actual;
    agent.energy = clamp(agent.energy - 8);
    return `foraged ${actual} food`;
  }
  agent.energy = clamp(agent.energy - 6);
  return 'foraged without success';
}

function actSleep(agent) {
  agent.energy = clamp(agent.energy + 45);
  agent.hunger = clamp(agent.hunger + 5);
  return 'slept';
}

function actWork(world, rand, agent) {
  const output = 1 + Math.floor(rand() * (2 + Math.round(agent.traits.diligence * 3)));
  const foodProduced = Math.max(1, Math.floor(output / 2));
  world.settlement.communalFood += foodProduced;
  agent.credits += output;
  agent.energy = clamp(agent.energy - 9);
  agent.hunger = clamp(agent.hunger + 3);
  return `worked and produced ${foodProduced} communal food`;
}

function actSocialize(world, rand, agent) {
  const other = chooseOther(world, rand, agent, false);
  if (!other) return 'looked for company';
  const change = 4 + rand() * 8;
  agent.social = clamp(agent.social + 22);
  other.social = clamp(other.social + 12);
  agent.affinity[other.id] = clamp((agent.affinity[other.id] ?? 45) + change);
  other.affinity[agent.id] = clamp((other.affinity[agent.id] ?? 45) + change * 0.8);
  agent.energy = clamp(agent.energy - 3);
  if (rand() < 0.12) remember(agent, `Had a meaningful conversation with ${other.name}.`, 0.65);
  return `socialized with ${other.name}`;
}

function actExplore(world, rand, agent) {
  agent.energy = clamp(agent.energy - 7);
  agent.hunger = clamp(agent.hunger + 2);
  if (rand() < 0.08) {
    const bonus = 2 + Math.floor(rand() * 3);
    world.ecosystem.wildFood = Math.min(world.ecosystem.carryingCapacity, world.ecosystem.wildFood + bonus);
    remember(agent, 'Found a productive patch of natural food.', 0.55);
    return 'explored and found a productive food patch';
  }
  return 'explored the area';
}

function decide(world, rand, agent) {
  if (!isAdult(agent)) {
    if (agent.hunger > 60) return 'eat';
    if (agent.energy < 45) return 'sleep';
    return rand() < 0.55 ? 'socialize' : 'explore';
  }
  if (agent.hunger > 72) return agent.food > 0 || world.settlement.communalFood > 0 ? 'eat' : 'forage';
  if (agent.energy < 28) return 'sleep';
  if (agent.social < 35) return 'socialize';
  const choices = [
    ['work', 0.25 + 0.35 * agent.traits.diligence],
    ['socialize', 0.12 + 0.35 * agent.traits.sociability],
    ['explore', 0.1 + 0.35 * agent.traits.curiosity],
    ['forage', 0.18],
    ['sleep', agent.energy < 55 ? 0.2 : 0.04]
  ];
  const total = choices.reduce((sum, [, weight]) => sum + weight, 0);
  let pick = rand() * total;
  for (const [choice, weight] of choices) {
    pick -= weight;
    if (pick <= 0) return choice;
  }
  return 'work';
}

function maybeFormPartnership(world, rand, agent) {
  if (!isAdult(agent) || agent.partnerId || !agent.alive) return;
  const candidates = aliveAgents(world).filter((other) => {
    if (other.id === agent.id || !isAdult(other) || other.partnerId || other.sex === agent.sex) return false;
    const affinity = agent.affinity[other.id] ?? 0;
    const reciprocal = other.affinity[agent.id] ?? 0;
    return affinity >= 72 && reciprocal >= 65;
  });
  if (!candidates.length || rand() >= 0.015) return;
  const partner = candidates[Math.floor(rand() * candidates.length)];
  agent.partnerId = partner.id;
  partner.partnerId = agent.id;
  remember(agent, `Formed a committed partnership with ${partner.name}.`, 0.95);
  remember(partner, `Formed a committed partnership with ${agent.name}.`, 0.95);
  emit(world, 'partnership_formed', { a: agent.id, b: partner.id }, 0.9);
}

function maybeStartPregnancy(world, rand, agent) {
  if (agent.sex !== 'female' || agent.pregnancyDaysLeft !== null || !agent.partnerId || !agent.alive) return;
  const age = ageYears(agent);
  if (age < 18 || age > 42) return;
  const partner = getAgent(world, agent.partnerId);
  if (!partner || !partner.alive || partner.sex !== 'male') return;
  if (rand() < 0.00085) {
    agent.pregnancyDaysLeft = 280;
    remember(agent, 'Became pregnant.', 0.95);
    remember(partner, `${agent.name} became pregnant.`, 0.9);
    emit(world, 'pregnancy_started', { mother: agent.id, partner: partner.id }, 0.9);
  }
}

function progressPregnancy(world, rand, agent) {
  if (agent.pregnancyDaysLeft === null) return;
  agent.pregnancyDaysLeft -= DAYS_PER_TICK;
  if (agent.pregnancyDaysLeft > 0) return;
  const partner = getAgent(world, agent.partnerId);
  const child = makeAgent(world, rand, world.nextAgentId, {
    ageYears: 0,
    sex: rand() < 0.5 ? 'female' : 'male',
    parents: [agent.id, partner?.id].filter(Boolean)
  });
  child.health = 92 + rand() * 8;
  child.hunger = 20;
  child.energy = 80;
  child.social = 70;
  child.food = 0;
  child.credits = 0;
  agent.children.push(child.id);
  if (partner) partner.children.push(child.id);
  agent.pregnancyDaysLeft = null;
  remember(agent, `Gave birth to ${child.name}.`, 1);
  if (partner) remember(partner, `${child.name} was born.`, 1);
  emit(world, 'birth', { child: child.id, mother: agent.id, partner: partner?.id ?? null }, 1);
}

function maybeDie(world, rand, agent) {
  if (!agent.alive) return;
  const age = ageYears(agent);
  let hazard = 0;
  if (agent.health <= 0) hazard = 1;
  else if (age > 85) hazard = 0.0025 * DAYS_PER_TICK * (1 + (age - 85) / 8);
  else if (age > 70) hazard = 0.00015 * DAYS_PER_TICK * (1 + (age - 70) / 15);
  if (hazard > 0 && rand() < hazard) {
    agent.alive = false;
    agent.health = 0;
    if (agent.partnerId) {
      const partner = getAgent(world, agent.partnerId);
      if (partner?.alive) {
        remember(partner, `${agent.name} died.`, 1);
        partner.partnerId = null;
      }
    }
    emit(world, 'death', { person: agent.id, age: rounded(age, 1) }, 1);
  }
}

function applyNeeds(agent, rand) {
  const age = ageYears(agent);
  agent.ageDays += DAYS_PER_TICK;
  agent.hunger = clamp(agent.hunger + (isAdult(agent) ? 7 : 5) + rand() * 2);
  agent.energy = clamp(agent.energy - (isAdult(agent) ? 6 : 4) - rand() * 2);
  agent.social = clamp(agent.social - 2 - rand() * 2);
  if (agent.hunger > 92) agent.health -= 2.2 + rand() * 1.8;
  if (agent.energy < 8) agent.health -= 0.7 + rand() * 0.6;
  if (agent.hunger < 70 && agent.energy > 25) agent.health += 0.15 * agent.traits.resilience;
  if (age < 1 && agent.hunger > 75) agent.health -= 1.5;
  agent.health = clamp(agent.health);
}

function tick(world, rand) {
  world.tick += 1;
  world.day += DAYS_PER_TICK;
  currentDay = world.day;
  world.ecosystem.wildFood = Math.min(world.ecosystem.carryingCapacity, world.ecosystem.wildFood + world.ecosystem.regenerationPerDay * DAYS_PER_TICK);

  const snapshot = aliveAgents(world);
  for (const agent of snapshot) {
    applyNeeds(agent, rand);
    const action = decide(world, rand, agent);
    let result;
    if (action === 'eat') result = actEat(world, agent) ?? actForage(world, rand, agent);
    else if (action === 'forage') result = actForage(world, rand, agent);
    else if (action === 'sleep') result = actSleep(agent);
    else if (action === 'work') result = actWork(world, rand, agent);
    else if (action === 'socialize') result = actSocialize(world, rand, agent);
    else result = actExplore(world, rand, agent);

    if (rand() < 0.015) emit(world, 'action', { person: agent.id, action, result }, 0.15);
    maybeFormPartnership(world, rand, agent);
    maybeStartPregnancy(world, rand, agent);
    progressPregnancy(world, rand, agent);
    maybeDie(world, rand, agent);
  }

  if (world.tick % TICKS_PER_DAY === 0) {
    emit(world, 'day_closed', {
      population: aliveAgents(world).length,
      communalFood: world.settlement.communalFood,
      wildFood: rounded(world.ecosystem.wildFood, 1)
    }, 0.1);
    saveWorld(world);
  }
}

function summary(world) {
  const alive = aliveAgents(world);
  const partnerships = alive.filter((agent) => agent.partnerId).length / 2;
  const births = world.agents.filter((agent) => agent.parents.length > 0).length;
  const deaths = world.agents.filter((agent) => !agent.alive).length;
  const pregnant = alive.filter((agent) => agent.pregnancyDaysLeft !== null).length;
  const avgHealth = alive.length ? alive.reduce((sum, agent) => sum + agent.health, 0) / alive.length : 0;
  return {
    simulatedDay: rounded(world.day),
    totalEverBorn: world.agents.length,
    populationAlive: alive.length,
    birthsAfterGenesis: births,
    deaths,
    partnerships: Math.round(partnerships),
    pregnancies: pregnant,
    communalFood: world.settlement.communalFood,
    wildFood: rounded(world.ecosystem.wildFood, 1),
    averageHealth: rounded(avgHealth, 1),
    eventsWritten: world.nextEventId - 1
  };
}

if (!Number.isFinite(daysToRun) || daysToRun <= 0) {
  console.error('Use --days=<positive number>');
  process.exit(1);
}

ensureFiles(reset);
const world = loadWorld(seedArg);
const rand = restoreRandom(world);
const targetDay = world.day + daysToRun;

if (world.tick === 0) {
  emit(world, 'genesis', { population: world.agents.length, seed: world.seed }, 1);
  saveWorld(world);
}

while (world.day + 1e-9 < targetDay) tick(world, rand);
saveWorld(world);
console.log(JSON.stringify(summary(world), null, 2));
