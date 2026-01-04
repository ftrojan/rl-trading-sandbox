# Agent-Based Market Model: Mathematical Background

## Overview

This document describes the mathematical foundations of the agent-based stock market simulator. The model simulates heterogeneous trading agents whose interactions create emergent market dynamics including volatility clustering, momentum, mean reversion, and realistic price formation.

---

## 1. Agent Decision Functions

### 1.1 Fundamentalists

Fundamentalists believe prices revert to fundamental value. Their trading signal is based on the deviation between current price and perceived fundamental value:

```
deviation = (V_f - P_t) / P_t

signal_fund = tanh(α_i × deviation × 10)
```

**Where:**
- `V_f` = Fundamental value (exogenous numeric input control parameter)
- `P_t` = Current market price at time t
- `α_i` = Agent-specific aggressiveness parameter ∈ [0.5, 1.0]
- `tanh()` = Hyperbolic tangent function, bounded to [-1, 1]

**Interpretation:**
- When `P_t < V_f`: Positive signal → Buy orders
- When `P_t > V_f`: Negative signal → Sell orders
- The tanh function creates saturation, preventing unbounded signals for large deviations

### 1.2 Chartists (Momentum Traders)

Chartists follow trends and momentum in recent price movements:

```
momentum = (P_t - P_{t-n}) / P_{t-n}

signal_chart = tanh(α_i × momentum × 20)
```

**Where:**
- `n` = Lookback period (typically 5-10 periods)
- `P_{t-n}` = Price n periods ago
- Other parameters as defined above

**Interpretation:**
- Positive momentum → Buy signal (trend following)
- Negative momentum → Sell signal (trend following)
- Amplification factor (20) makes chartists more responsive to trends than fundamentalists

### 1.3 Noise Traders

Noise traders provide liquidity and unpredictability:

```
signal_noise = (U(0,1) - 0.5) × 2 × α_i
```

**Where:**
- `U(0,1)` = Uniform random variable on [0, 1]
- Result is bounded to [-α_i, α_i]

**Interpretation:**
- Random buy/sell decisions
- Create market noise and prevent perfect predictability
- Essential for realistic market microstructure

---

## 2. Order Generation

Each agent converts their signal into an order:

```
if |signal_i| > threshold:
    order_size_i = |signal_i| × U(50, 100)
    order_side_i = sign(signal_i)  # Buy if positive, Sell if negative
```

**Where:**
- Threshold = 0.05 (filters out weak signals)
- Order size scales with signal strength and includes randomness

---

## 3. Market Clearing and Price Formation

### 3.1 Order Imbalance

```
N_buy = number of buy orders
N_sell = number of sell orders

imbalance = N_buy - N_sell
```

### 3.2 Price Impact Model

The price change is determined by order imbalance with a linear impact function:

```
price_change = (imbalance / N_total) × P_t × 0.02 × σ_factor
```

**Where:**
- `N_total` = Total number of agents
- Coefficient 0.02 = Price impact sensitivity parameter
- `σ_factor` = Volatility amplification factor (user-configurable)

### 3.3 Random Shocks

Additional noise term captures exogenous information:

```
ε_t ~ N(0, 0.005 × P_t × σ_factor)

P_mid,t = P_{t-1} + price_change + ε_t
```

---

## 4. Bid-Ask Spread Dynamics

The spread adapts to market volatility, capturing liquidity dynamics:

### 4.1 Volatility Estimation

Rolling window volatility (realized volatility):

```
returns_i = (P_i - P_{i-1}) / P_{i-1}    for i ∈ [t-20, t]

μ_r = mean(returns)

σ_t = sqrt(Σ(returns_i - μ_r)² / n)
```

**Where:**
- Window size = 20 periods
- `σ_t` = Instantaneous volatility estimate

### 4.2 Spread Calculation

```
spread_multiplier = 1 + σ_t × σ_factor

spread_base_pct = base_spread / 100

spread_t = P_t × spread_base_pct × spread_multiplier
```

**Interpretation:**
- Base spread: Minimum bid-ask spread (e.g., 0.5%)
- Multiplier increases spread during volatile periods
- Models market maker behavior: wider spreads when risk is higher

---

## 5. OHLC Bar Generation

Each period consists of multiple intra-period price ticks to create realistic OHLC bars:

### 5.1 Tick Generation

```
n_ticks ~ DiscreteUniform(5, 12)

for k = 1 to n_ticks:
    tick_k = P_mid,t + U(-spread_t, spread_t)
```

### 5.2 OHLC Construction

```
Open_t = tick_1
Close_t = tick_{n_ticks}
High_t = max(tick_1, ..., tick_{n_ticks})
Low_t = min(tick_1, ..., tick_{n_ticks})
```

### 5.3 Volume

```
Volume_t = Σ order_size_i    for all orders in period t
```

---

## 6. Mathematical Properties

### 6.1 Volatility Clustering

The model exhibits volatility clustering through feedback loops:

```
High volatility → Wider spreads → Larger price changes → More agent activity → Continued high volatility
```

This creates autocorrelation in absolute returns: `Corr(|r_t|, |r_{t-k}|) > 0` for small k.

### 6.2 Regime Switching

The market exhibits different regimes depending on agent dominance:

**Mean Reversion Regime:**
- Occurs when `|P_t - V_f| / P_t` is large
- Fundamentalists dominate trading
- Prices pulled back toward fundamental value

**Momentum Regime:**
- Occurs during sustained trends
- Chartists dominate trading  
- Prices exhibit persistence and trending behavior

### 6.3 Fat-Tailed Returns

The interaction of heterogeneous agents with nonlinear decision rules creates return distributions with:
- Higher kurtosis than Gaussian (fat tails)
- More frequent extreme events
- Matches empirical market data better than GBM

### 6.4 Price Impact and Market Depth

Linear price impact implies constant market depth:

```
ΔP ∝ Q_net

Market depth = 1 / (0.02 × σ_factor)
```

Where `Q_net` is net order flow.

---

## 7. Model Calibration

### 7.1 Key Parameters

| Parameter | Typical Range | Effect |
|-----------|--------------|--------|
| N_fundamentalists | 20-50 | ↑ More mean reversion |
| N_chartists | 10-30 | ↑ More momentum |
| N_noise | 30-100 | ↑ More randomness |
| V_f / P_0 | 0.8-1.2 | Deviation creates directional bias |
| base_spread | 0.1-2.0% | Liquidity conditions |
| σ_factor | 0.5-2.0 | Overall volatility level |

### 7.2 Agent Composition Effects

```
R_fund = N_fundamentalists / N_total
R_chart = N_chartists / N_total
R_noise = N_noise / N_total
```

**Empirical observations:**
- High `R_fund`: Strong mean reversion, lower volatility
- High `R_chart`: Trending behavior, momentum, higher volatility
- High `R_noise`: Increased randomness, reduced autocorrelation

---

## 8. Comparison to Classical Models

### 8.1 vs. Geometric Brownian Motion (GBM)

**GBM:**
```
dP_t = μ P_t dt + σ P_t dW_t
```

**ABM advantages:**
- Endogenous volatility (time-varying, state-dependent)
- Path-dependent dynamics through agent memory
- Realistic microstructure (spreads, order flow)
- Regime changes without external shocks
- Fat-tailed returns emerge naturally

### 8.2 vs. Stochastic Volatility Models

While models like Heston add stochastic volatility:
```
dσ_t² = κ(θ - σ_t²)dt + ξσ_t dW_t
```

ABMs generate volatility dynamics endogenously from agent behavior rather than as an exogenous process.

---

## 9. Stylized Facts Reproduced

The model reproduces key empirical regularities:

1. **Volatility clustering**: `Corr(|r_t|, |r_{t+k}|) > 0`
2. **Fat tails**: Excess kurtosis in returns distribution
3. **Absence of autocorrelation in returns**: `Corr(r_t, r_{t+k}) ≈ 0`
4. **Volume-volatility correlation**: High volume periods coincide with high volatility
5. **Leverage effect**: Negative returns associated with increased volatility
6. **Time-varying bid-ask spreads**: Spreads widen during volatile periods

---

## 10. Extensions and Variants

Possible model extensions:

### 10.1 Adaptive Agent Beliefs
```
α_{i,t+1} = α_{i,t} + η × (profit_{i,t} - mean_profit_t)
```

Agents adjust aggressiveness based on recent profitability.

### 10.2 Order Book Dynamics

Add explicit limit order book with:
- Limit orders at various price levels
- Market impact through order book depth
- Price formation via order matching

### 10.3 Information Asymmetry

Introduce informed traders with:
```
signal_informed = sign(V_true - P_t) + noise
```

Where `V_true` is known only to informed agents.

---

## References

This model draws on the heterogeneous agent modeling (HAM) literature:

- **Brock, W. A., & Hommes, C. H.** (1998). Heterogeneous beliefs and routes to chaos in a simple asset pricing model. *Journal of Economic Dynamics and Control*, 22(8-9), 1235-1274.

- **Lux, T., & Marchesi, M.** (1999). Scaling and criticality in a stochastic multi-agent model of a financial market. *Nature*, 397(6719), 498-500.

- **LeBaron, B.** (2006). Agent-based computational finance. *Handbook of computational economics*, 2, 1187-1233.

- **Farmer, J. D., & Foley, D.** (2009). The economy needs agent-based modelling. *Nature*, 460(7256), 685-686.

---

## Appendix: Implementation Notes

### A.1 Numerical Stability

- Use logarithmic returns for volatility calculations when prices vary widely
- Clip extreme signals to prevent numerical overflow
- Ensure minimum spread > 0 to avoid division by zero

### A.2 Computational Complexity

Time complexity per period: O(N_agents)
Space complexity: O(N_periods) for history storage

### A.3 Random Number Generation

Use proper seeding for reproducibility:
```javascript
Math.seedrandom(seed);  // If using seedrandom library
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Simulation Code:** See accompanying HTML artifact (abm-stock-simulator)