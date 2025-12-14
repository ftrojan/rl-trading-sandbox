import pandas as pd
import gymnasium as gym
from stable_baselines3.common.vec_env import DummyVecEnv
from env_forex import ForexTradingEnv


def get_env(name: str, df: pd.DataFrame) -> gym.Env:
    if name == "EURUSD":
        # create env
        env = ForexTradingEnv(
            df=df,
            window_size=30,
            sl_options=[30, 60, 80],  # example SL distances in pips
            tp_options=[30, 60, 80],  # example TP distances in pips
        )
    else:
        raise ValueError(name)
    return env


def get_vec_env(name: str, df: pd.DataFrame) -> DummyVecEnv:
    """Wrap in a DummyVecEnv (required by stable-baselines for parallelization)"""
    env = get_env(name, df)
    vec_env = DummyVecEnv([lambda: env])
    return vec_env


