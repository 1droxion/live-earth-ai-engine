from engine.kernel import make_world
from engine.simulation import run


def test_world_is_deterministic():
    a = make_world(seed=42, population=10)
    b = make_world(seed=42, population=10)
    run(a, ticks=48)
    run(b, ticks=48)
    assert a.to_dict() == b.to_dict()


def test_population_and_time_advance():
    world = make_world(seed=7, population=25)
    run(world, ticks=24)
    assert world.day == 1
    assert len(world.agents) == 25
    assert world.tick == 24
