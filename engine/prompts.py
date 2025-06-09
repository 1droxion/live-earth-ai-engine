def build_prompt(world):
    tick = world["tick"]
    history = world["history"][-3:]
    return (
        f"Day {tick} of the AI world.\n"
        f"Recent events:\n- " + "\n- ".join(history) + "\n\n"
        "What happens next in the world's evolution?"
    )
