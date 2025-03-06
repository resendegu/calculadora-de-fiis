import { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import './App.css';
import { IconButton, InputAdornment } from '@mui/material';
import { AddCircle } from '@mui/icons-material';

type Fund = {
  id: number;
  name: string;
  dividend: string;
  price: string;
};

type ResultRow = {
  fundName: string;
  shares: number;
  cost: number;
  dividendPayment: number; // new field for dividend paid by each fund
};

function App() {
  const [dividendGoal, setDividendGoal] = useState('');
  const [funds, setFunds] = useState<Fund[]>([{
    id: 0,
    name: '',
    dividend: '0.00',
    price: '0.00'
  }]);
  const [calculationResult, setCalculationResult] = useState<{ rows: ResultRow[]; totalInvestment: number; totalDividendPayment: number } | null>(null);

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

    const rows: ResultRow[] = [];
    let totalInvestment = 0;
    let totalDividendPayment = 0;
    fundsWithYield.forEach(f => {
      const allocation = (f.yieldValue / totalYield) * goal;
      const shares = Math.ceil(allocation / f.dividend);
      const cost = shares * f.price;
      const dividendPayment = shares * f.dividend; // calculate dividend per fund
      totalInvestment += cost;
      totalDividendPayment += dividendPayment;
      rows.push({ fundName: f.name, shares, cost, dividendPayment });
    });
    setCalculationResult({ rows, totalInvestment, totalDividendPayment });
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Calculadora de FIIs
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          type="number"
          label="Meta de total dividendos/mês"
          placeholder="Ex: 1000"
          value={dividendGoal}
          onChange={(e) => setDividendGoal(e.target.value)}
          variant="outlined"
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
          }}
        />
      </Box>
      <Paper sx={{ mb: 2, overflow: 'auto'}}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell style={{ minWidth: 100 }}>Fundo</TableCell>
              <TableCell style={{ minWidth: 100 }}>Dividendo (R$)</TableCell>
              <TableCell style={{ minWidth: 100 }}>Preço (R$)</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={addFund}>
                  <AddCircle />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {funds.map(fund => (
              <TableRow key={fund.id}>
                <TableCell>
                  <TextField
                    fullWidth
                    value={fund.name}
                    onChange={(e) => updateFund(fund.id, 'name', e.target.value)}
                    placeholder='XPML11'
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    type="number"
                    value={fund.dividend}
                    onChange={(e) => updateFund(fund.id, 'dividend', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    type="number"
                    value={fund.price}
                    onChange={(e) => updateFund(fund.id, 'price', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" color="error" onClick={() => removeFund(fund.id)}>
                    Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} align="left">
                <Button variant="outlined" color="primary" onClick={addFund} startIcon={<AddCircle />}>
                  Adicionar Fundo
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" color="secondary" onClick={calculate}>
          Calcular
        </Button>
      </Box>
      {calculationResult && (
        <Paper sx={{ p: 2, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Resultados:
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fundo</TableCell>
                <TableCell>Cotas</TableCell>
                <TableCell>Dividendos (R$)</TableCell>
                <TableCell>Investido (R$)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculationResult.rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.fundName}</TableCell>
                  <TableCell>{row.shares}</TableCell>
                  <TableCell>{row.dividendPayment.toFixed(2)}</TableCell>
                  <TableCell>{row.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2}><strong>Total</strong></TableCell>
                <TableCell><strong>R$ {calculationResult.totalDividendPayment.toFixed(2)}</strong></TableCell>
                <TableCell><strong>R$ {calculationResult.totalInvestment.toFixed(2)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}

export default App;
