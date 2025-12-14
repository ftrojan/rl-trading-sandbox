import pandas as pd
import gymnasium as gym
from stable_baselines3.common.vec_env import DummyVecEnv
from env_forex import ForexTradingEnv
from env_stocks import StocksEnv


def get_env(name: str, df: pd.DataFrame) -> gym.Env:
    if name == "EURUSD":
        # create env
        env = ForexTradingEnv(
            df=df,
            window_size=30,
            sl_options=[30, 60, 80],  # example SL distances in pips
            tp_options=[30, 60, 80],  # example TP distances in pips
        )
    elif name in ("GOOG", "MA"):
        env = StocksEnv(
            df=df,
            window_size=10,
            frame_bound=(10, len(df)),
        )
    else:
        raise ValueError(name)
    return env


def get_vec_env(name: str, df: pd.DataFrame) -> DummyVecEnv:
    """Wrap in a DummyVecEnv (required by stable-baselines for parallelization)"""
    env = get_env(name, df)
    vec_env = DummyVecEnv([lambda: env])
    return vec_env


