import json, time, openai
from prompts import build_prompt

openai.api_key = "sk-xxxx"  # REPLACE with your key

# Load or create world
try:
    with open("world_state.json", "r") as f:
        world = json.load(f)
except:
    world = {
        "tick": 0,
        "history": ["🌌 The Big Bang occurred. The universe begins expanding..."]
    }

def ask_gpt(prompt):
    res = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are simulating the evolution of a fictional AI-generated world."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.9
    )
    return res.choices[0].message.content.strip()

while True:
    world["tick"] += 1
    prompt = build_prompt(world)
    result = ask_gpt(prompt)
    world["history"].append(result)

    with open("world_state.json", "w") as f:
        json.dump(world, f, indent=2)

    with open("story_feed.txt", "a") as f:
        f.write(f"[Day {world['tick']}]: {result}\n\n")

    print(f"[Day {world['tick']}]: {result}\n")
    time.sleep(10)
