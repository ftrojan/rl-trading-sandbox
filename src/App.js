import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InventoryRLSimulator = () => {
  const [config, setConfig] = useState({
    baseDemand: 10,
    demandVariability: 3,
    weekendMultiplier: 1.5,
    sellingPrice: 10,
    orderCost: 5,
    holdingCost: 0.5,
    stockoutPenalty: 15,
    maxInventory: 50,
    leadTime: 0
  });

  const [simState, setSimState] = useState({
    day: 0,
    inventory: 20,
    totalProfit: 0,
    history: []
  });

  const [isRunning, setIsRunning] = useState(false);
  const [orderAmount, setOrderAmount] = useState(10);
  const [policy, setPolicy] = useState('manual');

  const getDayName = (day) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[day % 7];
  };

  const isWeekend = (day) => {
    return (day % 7) >= 5;
  };

  const generateDemand = (day) => {
    const { baseDemand, demandVariability, weekendMultiplier } = config;
    const multiplier = isWeekend(day) ? weekendMultiplier : 1.0;
    const mean = baseDemand * multiplier;
    const noise = (Math.random() - 0.5) * 2 * demandVariability;
    return Math.max(0, Math.round(mean + noise));
  };

  const getSimplePolicy = (inventory, day) => {
    const targetInventory = isWeekend(day + 1) ? 25 : 20;
    return Math.max(0, targetInventory - inventory);
  };

  const simulateDay = (currentInventory, orderQty) => {
    const { day } = simState;
    const { sellingPrice, orderCost, holdingCost, stockoutPenalty } = config;

    const newInventory = currentInventory + orderQty;
    const demand = generateDemand(day);
    const sales = Math.min(demand, newInventory);
    const stockout = Math.max(0, demand - newInventory);
    const endInventory = newInventory - sales;

    const revenue = sales * sellingPrice;
    const orderingCost = orderQty * orderCost;
    const holdingCostTotal = endInventory * holdingCost;
    const stockoutCost = stockout * stockoutPenalty;

    const profit = revenue - orderingCost - holdingCostTotal - stockoutCost;

    return {
      demand,
      sales,
      stockout,
      endInventory,
      profit,
      revenue,
      orderingCost,
      holdingCostTotal,
      stockoutCost
    };
  };

  const step = () => {
    const order = policy === 'manual' ? orderAmount : getSimplePolicy(simState.inventory, simState.day);
    const result = simulateDay(simState.inventory, order);

    const newHistory = [...simState.history, {
      day: simState.day,
      dayName: getDayName(simState.day),
      startInventory: simState.inventory,
      order,
      demand: result.demand,
      sales: result.sales,
      stockout: result.stockout,
      endInventory: result.endInventory,
      profit: result.profit,
      totalProfit: simState.totalProfit + result.profit
    }];

    setSimState({
      day: simState.day + 1,
      inventory: result.endInventory,
      totalProfit: simState.totalProfit + result.profit,
      history: newHistory
    });
  };

  const reset = () => {
    setSimState({
      day: 0,
      inventory: 20,
      totalProfit: 0,
      history: []
    });
    setIsRunning(false);
  };

  const runSimulation = (days) => {
    let state = { ...simState };
    for (let i = 0; i < days; i++) {
      const order = policy === 'manual' ? orderAmount : getSimplePolicy(state.inventory, state.day);
      const result = simulateDay(state.inventory, order);

      state.history.push({
        day: state.day,
        dayName: getDayName(state.day),
        startInventory: state.inventory,
        order,
        demand: result.demand,
        sales: result.sales,
        stockout: result.stockout,
        endInventory: result.endInventory,
        profit: result.profit,
        totalProfit: state.totalProfit + result.profit
      });

      state.day += 1;
      state.inventory = result.endInventory;
      state.totalProfit += result.profit;
    }
    setSimState(state);
  };

  const chartData = simState.history.slice(-30).map(h => ({
    day: h.dayName + h.day,
    Inventory: h.endInventory,
    Demand: h.demand,
    Order: h.order
  }));

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Inventory Management RL Simulator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Configuration</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Base Demand</label>
              <input
                type="number"
                value={config.baseDemand}
                onChange={(e) => setConfig({...config, baseDemand: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Demand Variability (±)</label>
              <input
                type="number"
                value={config.demandVariability}
                onChange={(e) => setConfig({...config, demandVariability: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Weekend Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={config.weekendMultiplier}
                onChange={(e) => setConfig({...config, weekendMultiplier: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Selling Price</label>
                <input
                  type="number"
                  value={config.sellingPrice}
                  onChange={(e) => setConfig({...config, sellingPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Order Cost</label>
                <input
                  type="number"
                  value={config.orderCost}
                  onChange={(e) => setConfig({...config, orderCost: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Holding Cost/Day</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.holdingCost}
                  onChange={(e) => setConfig({...config, holdingCost: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Stockout Penalty</label>
                <input
                  type="number"
                  value={config.stockoutPenalty}
                  onChange={(e) => setConfig({...config, stockoutPenalty: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Current State</h2>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-gray-600">Day</div>
              <div className="text-2xl font-bold text-blue-600">{simState.day} ({getDayName(simState.day)})</div>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-gray-600">Current Inventory</div>
              <div className="text-2xl font-bold text-green-600">{simState.inventory} units</div>
            </div>

            <div className="bg-purple-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Profit</div>
              <div className="text-2xl font-bold text-purple-600">${simState.totalProfit.toFixed(2)}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Policy</label>
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="manual">Manual Control</option>
                <option value="simple">Simple Heuristic</option>
              </select>
            </div>

            {policy === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Order Amount</label>
                <input
                  type="number"
                  min="0"
                  max={config.maxInventory}
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={step}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Step 1 Day
              </button>
              <button
                onClick={() => runSimulation(7)}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Run 7 Days
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {simState.history.length > 0 && (
        <>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Inventory & Demand Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Inventory" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="Demand" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Order" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Day</th>
                    <th className="px-3 py-2 text-right">Start Inv</th>
                    <th className="px-3 py-2 text-right">Order</th>
                    <th className="px-3 py-2 text-right">Demand</th>
                    <th className="px-3 py-2 text-right">Sales</th>
                    <th className="px-3 py-2 text-right">Stockout</th>
                    <th className="px-3 py-2 text-right">End Inv</th>
                    <th className="px-3 py-2 text-right">Profit</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {simState.history.slice(-10).reverse().map((h, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{h.day} ({h.dayName})</td>
                      <td className="px-3 py-2 text-right">{h.startInventory}</td>
                      <td className="px-3 py-2 text-right">{h.order}</td>
                      <td className="px-3 py-2 text-right">{h.demand}</td>
                      <td className="px-3 py-2 text-right">{h.sales}</td>
                      <td className="px-3 py-2 text-right text-red-600">{h.stockout > 0 ? h.stockout : '-'}</td>
                      <td className="px-3 py-2 text-right">{h.endInventory}</td>
                      <td className="px-3 py-2 text-right font-semibold">${h.profit.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">${h.totalProfit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">RL Problem Formulation:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>State:</strong> Current inventory, day of week, recent demand history</li>
          <li><strong>Action:</strong> Order quantity (0 to max inventory)</li>
          <li><strong>Reward:</strong> Daily profit (revenue - order cost - holding cost - stockout penalty)</li>
          <li><strong>Goal:</strong> Learn a policy that maximizes cumulative profit over time</li>
        </ul>
      </div>
    </div>
  );
};

export default InventoryRLSimulator;