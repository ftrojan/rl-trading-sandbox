import datetime
import pandas as pd
import pandas_ta as ta


def olhc_1h(df: pd.DataFrame) -> pd.DataFrame:
    h = df.index.floor("h")
    res = df.groupby(h).agg(
        Open=pd.NamedAgg('Open', aggfunc='first'),
        High=pd.NamedAgg('High', aggfunc='max'),
        Low=pd.NamedAgg('Low', aggfunc='min'),
        Close=pd.NamedAgg('Close', aggfunc='last'),
    )
    return res


def load_and_preprocess_data(name: str, task: str) -> pd.DataFrame:
    match name:
        case "EURUSD":
            if task == "train":
                path = "data/EURUSD_Candlestick_1_Hour_BID_01.07.2020-15.07.2023.csv"
            elif task == "test":
                path = "data/test_EURUSD_Candlestick_1_Hour_BID_20.02.2023-22.02.2025.csv"
            else:
                raise ValueError("Invalid task")
            return load_and_preprocess_eurusd(path)
        case "GOOG":
            return load_and_preprocess_name(name, task)
        case "MA":
            return load_and_preprocess_name(name, task)
        case _:
            raise Exception(f"Invalid name: {name}")


def load_and_preprocess_eurusd(csv_path: str) -> pd.DataFrame:
    """
    Loads EURUSD data from CSV and preprocesses it by adding technical indicators.
    Expects columns: [Gmt time, Open, High, Low, Close, Volume].
    """
    df = pd.read_csv(csv_path, parse_dates=True, index_col='Gmt time')
    
    # Sort by date just in case
    df.sort_index(inplace=True)
    
    # Example technical indicators from pandas_ta
    df['rsi_14'] = ta.rsi(df['Close'], length=14)
    df['ma_20'] = ta.sma(df['Close'], length=20)
    df['ma_50'] = ta.sma(df['Close'], length=50)
    df['atr'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
    
    # You could add more features: slopes, candlestick patterns, etc.
    # For example: slope of ma_20
    df['ma_20_slope'] = df['ma_20'].diff()
    
    # Drop any rows with NaN
    df.dropna(inplace=True)
    
    return df


def load_and_preprocess_name(name: str, task: str) -> pd.DataFrame:
    with open(f"data/{name}.csv") as fp:
        df_all = pd.read_csv(fp, parse_dates=True, index_col='time')
        df_h = olhc_1h(df_all)
    train_dt = datetime.datetime.fromisoformat("2025-01-01T00:00:00+00:00")
    if task == "train":
        df = df_h.loc[:train_dt, :]
    elif task == "test":
        df = df_h.loc[train_dt:, :]
    else:
        raise ValueError("Invalid task")
    return df
