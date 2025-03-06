import { useState } from 'react'
import './App.css'

type Fund = {
  id: number;
  name: string;
  dividend: string;
  price: string;
};

function App() {
  const [dividendGoal, setDividendGoal] = useState('');
  const [funds, setFunds] = useState<Fund[]>([]);
  const [result, setResult] = useState<string>('');

  // Function to add an empty fund
  function addFund() {
    const newFund: Fund = {
      id: Date.now(),
      name: '',
      dividend: '',
      price: ''
    };
    setFunds(prev => [...prev, newFund]);
  }

  // Update a fund field
  function updateFund(id: number, field: keyof Fund, value: string) {
    setFunds(prev => prev.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  }

  // Remove a fund
  function removeFund(id: number) {
    setFunds(prev => prev.filter(f => f.id !== id));
  }

  // Calculate results based on funds and dividend goal
  function calculate() {
    const goal = parseFloat(dividendGoal);
    if (isNaN(goal) || goal <= 0) {
      alert('Insira um valor válido para os dividendos mensais desejados.');
      return;
    }

    const validFunds = funds.filter(f => {
      const dividend = parseFloat(f.dividend);
      const price = parseFloat(f.price);
      return f.name && !isNaN(dividend) && !isNaN(price) && dividend > 0 && price > 0;
    });

    if (validFunds.length === 0) {
      alert('Adicione ao menos um fundo com dados válidos.');
      return;
    }

    let totalYield = 0;
    const fundsWithYield = validFunds.map(f => {
      const dividend = parseFloat(f.dividend);
      const price = parseFloat(f.price);
      const yieldValue = dividend / price;
      totalYield += yieldValue;
      return { ...f, dividend, price, yieldValue };
    });

    let output = '<h2>Resultados:</h2><ul>';
    let totalInvestment = 0;

    fundsWithYield.forEach(f => {
      const allocation = (f.yieldValue / totalYield) * goal;
      const shares = Math.ceil(allocation / f.dividend);
      const cost = shares * f.price;
      totalInvestment += cost;
      output += `<li><strong>${f.name}</strong>: ${shares} cotas (Investimento: R$ ${cost.toFixed(2)})</li>`;
    });
    output += `</ul><p><strong>Investimento total:</strong> R$ ${totalInvestment.toFixed(2)}</p>`;
    setResult(output);
  }

  return (
    <>
      <h1>Calculadora de investimentos para Fundos Imobiliários</h1>
      <label htmlFor="dividendGoal">Dividendos mensais desejados: R$</label>
      <input
        type="number"
        id="dividendGoal"
        placeholder="Ex: 1000"
        value={dividendGoal}
        onChange={e => setDividendGoal(e.target.value)}
      />
      <button id="addFund" onClick={addFund}>Adicionar Fundo</button>
      
      <div id="fundsContainer">
        {funds.map(fund => (
          <div key={fund.id} className="fund">
            {/* Fund inputs */}
            <input
              type="text"
              placeholder="Nome do Fundo"
              className="fundName"
              value={fund.name}
              onChange={e => updateFund(fund.id, 'name', e.target.value)}
            />
            <input
              type="number"
              placeholder="Dividendo/Cota"
              className="dividend"
              step="0.01"
              value={fund.dividend}
              onChange={e => updateFund(fund.id, 'dividend', e.target.value)}
            />
            <input
              type="number"
              placeholder="Preço da Cota"
              className="price"
              step="0.01"
              value={fund.price}
              onChange={e => updateFund(fund.id, 'price', e.target.value)}
            />
            <button onClick={() => removeFund(fund.id)} className="removeFund">Remover</button>
          </div>
        ))}
      </div>
      
      <button id="calculate" onClick={calculate}>Calcular</button>
      
      <div className="result" id="result" dangerouslySetInnerHTML={{ __html: result }}></div>
    </>
  )
}

export default App
