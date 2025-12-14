import matplotlib.pyplot as plt
from stable_baselines3 import PPO
from indicators import load_and_preprocess_data
from trading_env import get_vec_env

def main(name: str):
    df = load_and_preprocess_data(name, task="train")
    
    vec_env = get_vec_env(name, df)
    
    # Define RL model (PPO)
    model = PPO(
        policy="MlpPolicy",
        env=vec_env,
        verbose=1,
        tensorboard_log="./tensorboard_log/"
    )
    
    # Train the model
    model.learn(total_timesteps=10100)
    model.save(f"models/{name}")
    print("Model saved successfully!")
    
    # Evaluate or test the model
    obs = vec_env.reset()
    equity_curve = []
    
    while True:
        action, _states = model.predict(obs, deterministic=True)
        obs, rewards, done, info = vec_env.step(action)
        
        # Collect equity from the unwrapped environment
        # Because we have a DummyVecEnv, we can access env_method to get the attribute
        current_equity = vec_env.get_attr("equity")[0]
        equity_curve.append(current_equity)
        
        if done[0]:
            break
    
    # Plot the final equity curve
    plt.figure(figsize=(10, 6))
    plt.plot(equity_curve, label='Equity')
    plt.title("Equity Curve during Evaluation")
    plt.xlabel("Time Steps")
    plt.ylabel("Equity")
    plt.legend()
    plt.show()


if __name__ == "__main__":
    # EURUSD GOOG MA
    main("EURUSD")
