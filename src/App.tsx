import { useState, useEffect, useRef } from 'react';
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
  dividendPayment: number;
};

type Save = {
  name: string;
  dividendGoal: string;
  funds: Fund[];
};

function App() {
  const [dividendGoal, setDividendGoal] = useState('');
  const [funds, setFunds] = useState<Fund[]>([]);
  const [calculationResult, setCalculationResult] = useState<{ rows: ResultRow[]; totalInvestment: number; totalDividendPayment: number } | null>(null);
  const [saves, setSaves] = useState<Save[]>([]);
  const [selectedSave, setSelectedSave] = useState<string>('');
  const [newSaveName, setNewSaveName] = useState('');

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDividendGoal = sessionStorage.getItem("dividendGoal");
    const savedFunds = sessionStorage.getItem("funds");
    if (savedDividendGoal) {
      setDividendGoal(savedDividendGoal);
    }
    if (savedFunds) {
      try {
        setFunds(JSON.parse(savedFunds));
      } catch (e) {
        console.error("Error parsing saved funds", e);
      }
    }
    const savedSaves = localStorage.getItem("saves");
    if (savedSaves) {
      try {
        setSaves(JSON.parse(savedSaves));
      } catch (e) {
        console.error("Error parsing saved configurations", e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("dividendGoal", dividendGoal);
    if (funds.length !== 0) {
      sessionStorage.setItem("funds", JSON.stringify(funds));
    }
  }, [dividendGoal, funds]);

  useEffect(() => {
    if (calculationResult) {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [calculationResult]);

  function addFund() {
    const newFund: Fund = {
      id: Date.now(),
      name: '',
      dividend: '',
      price: ''
    };
    setFunds(prev => [...prev, newFund]);
  }

  function updateFund(id: number, field: keyof Fund, value: string) {
    setFunds(prev => prev.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  }

  function removeFund(id: number) {
    setFunds(prev => prev.filter(f => f.id !== id));
    if (funds.length === 1) {
      sessionStorage.removeItem("funds");
    }
  }

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
      const dividendPayment = shares * f.dividend;
      totalInvestment += cost;
      totalDividendPayment += dividendPayment;
      rows.push({ fundName: f.name, shares, cost, dividendPayment });
    });
    setCalculationResult({ rows, totalInvestment, totalDividendPayment });
  }

  // New function to save the current configuration
  function handleSaveCurrent() {
    if (!newSaveName.trim()) {
      alert("Digite um nome para a configuração.");
      return;
    }
    const newSave: Save = { name: newSaveName, dividendGoal, funds };
    setSaves(prev => {
      const updated = [...prev.filter(s => s.name !== newSaveName), newSave];
      localStorage.setItem("saves", JSON.stringify(updated));
      return updated;
    });
    setNewSaveName('');
    alert("Configuração salva!");
  }

  // New function to load a selected configuration
  function handleLoadSave() {
    const saveToLoad = saves.find(s => s.name === selectedSave);
    if (saveToLoad) {
      setDividendGoal(saveToLoad.dividendGoal);
      setFunds(saveToLoad.funds);
      setNewSaveName(saveToLoad.name);
    } else {
      alert("Selecione uma configuração para carregar.");
    }
  }

  // New function to delete a selected configuration
  function handleDeleteSave() {
    if (!selectedSave) {
      alert("Selecione uma configuração para deletar.");
      return;
    }
    const updatedSaves = saves.filter(s => s.name !== selectedSave);
    setSaves(updatedSaves);
    localStorage.setItem("saves", JSON.stringify(updatedSaves));
    setSelectedSave('');
    alert("Configuração deletada!");
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Calculadora de Dividendos de FIIs
      </Typography>
      {/* New UI for loading a saved configuration */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Carteiras salvas"
          value={selectedSave}
          onChange={(e) => setSelectedSave(e.target.value)}
          SelectProps={{ native: true }}
          variant="outlined"
          sx={{ minWidth: 200 }}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        >
          <option value="">Selecione</option>
          {saves.map(save => (
            <option key={save.name} value={save.name}>{save.name}</option>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleLoadSave}>
          Carregar carteira
        </Button>
        {/* New delete button */}
        <Button variant="contained" color="error" onClick={handleDeleteSave}>
          Deletar carteira
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          style={{ minWidth: 200 }}
          type="number"
          label="Meta de total dividendos/mês"
          placeholder="1000.00"
          value={dividendGoal}
          onChange={(e) => setDividendGoal(e.target.value)}
          variant="outlined"
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
          }}
        />
        <TextField
          fullWidth
          label="Nome da carteira"
          value={newSaveName}
          onChange={(e) => setNewSaveName(e.target.value)}
          variant="outlined"
        />
      </Box>
      <Paper sx={{ mb: 2, overflow: 'auto'}} elevation={8}>
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
                    placeholder='Ex.: XPML11'
                    variant='standard'
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
                    variant='standard'
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
                    variant='standard'
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size='small' color="error" onClick={() => removeFund(fund.id)}>
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
      <Box display='flex' sx={{ mb: 2, gap: 2 }}>
        <Button variant="contained" color="secondary" onClick={calculate}>
          Calcular
        </Button>
        <Button variant="contained" onClick={handleSaveCurrent}>
          Salvar carteira
        </Button>
      </Box>
      {calculationResult && (
        <Paper ref={resultRef} sx={{ p: 2, overflow: 'auto' }} elevation={8}>
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
