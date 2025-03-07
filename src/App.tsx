import { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, TextField, Button, Paper, Box, 
  Table, TableHead, TableRow, TableBody, TableCell, ButtonGroup, 
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem, 
  Select, Tooltip, useMediaQuery, Dialog, DialogTitle, DialogContent, 
  DialogActions 
} from '@mui/material';
import { AddCircle, BuildCircle, Help, Update } from '@mui/icons-material';
import './App.css';

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
  const [openHelp, setOpenHelp] = useState(false);

  const isScreenSmall = useMediaQuery('(max-width:600px)');

  const resultRef = useRef<HTMLDivElement>(null);

  function getFundUrl(fund:string) {
    return `https://cotacao.b3.com.br/mds/api/v1/instrumentQuotation/${fund}`;
  }

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

  async function fetchAndUpdateFundPrice(id: number, fundName: string) {
    if (!fundName.trim()) return;
    try {
      const url = getFundUrl(fundName);
      const response = await fetch(url);
      const data = await response.json();
      const curPrc = data?.Trad?.[0]?.scty?.SctyQtn?.curPrc;
      if (curPrc) {
        updateFund(id, 'price', curPrc.toString());
      }
    } catch (error) {
      console.error('Error fetching fund price:', error);
    }
  }

  function handleUpdateAllPrices() {
    funds.forEach(fund => {
      if (fund.name.trim()) {
        fetchAndUpdateFundPrice(fund.id, fund.name);
      }
    });
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
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant={isScreenSmall ? 'h6' : 'h4'} component="h1" gutterBottom>
          Calculadora de Dividendos
        </Typography>
        <Tooltip title="Como funciona?" arrow>
          <IconButton onClick={() => setOpenHelp(true)}>
            <Help />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: isScreenSmall ? 'grid' : 'flex', gap: 2, mb: 2 }}>
        <FormControl>
          <InputLabel id="selectWalletLabel">Carteiras salvas</InputLabel>
          <Select
            labelId="selectWalletLabel"
            id="selectWallet"
            value={selectedSave}
            onChange={(e) => {
              setSelectedSave(e.target.value)
            }}
            variant="standard"
            sx={{ minWidth: 200 }}
            size='small'
          >
            {saves.map(save => (
              <MenuItem key={save.name} value={save.name}>{save.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ButtonGroup variant='outlined' size='small' fullWidth={isScreenSmall}>
          <Button onClick={handleLoadSave}>
            Usar
          </Button>
          <Button color="error" onClick={handleDeleteSave}>
            Deletar
          </Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          sx={{ width: isScreenSmall ? 200 : '100%' }}
          type="number"
          label={isScreenSmall ? "Meta dividendos" : "Meta de total dividendos/mês"} 
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
      <Box display='flex' justifyContent='flex-end' sx={{ mb: 2 }}>
        <Tooltip title="Adicionar fundo" arrow>
          <IconButton color="primary" onClick={addFund}>
            <AddCircle />
          </IconButton>
        </Tooltip>
        <Tooltip title="Atualizar preços" arrow>
          <IconButton color="primary" onClick={handleUpdateAllPrices}>
            <Update />
          </IconButton>
        </Tooltip>
      </Box>
      <Paper sx={{ mb: 2, overflow: 'auto'}} elevation={8}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell style={{ minWidth: 100 }}>Fundo</TableCell>
              <TableCell style={{ minWidth: 100 }}>Dividendo (R$)</TableCell>
              <TableCell style={{ minWidth: 100 }}>Preço (R$)</TableCell>
              <TableCell align='center'><BuildCircle /></TableCell>
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
                    onBlur={() => fetchAndUpdateFundPrice(fund.id, fund.name)}
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
                    placeholder='0.90'
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
                    placeholder='100.00'
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
                  <TableCell>
                    {row.dividendPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    {row.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2}><strong>Total</strong></TableCell>
                <TableCell>
                  <strong>
                    {calculationResult.totalDividendPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </TableCell>
                <TableCell>
                  <strong>
                    {calculationResult.totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
      <Dialog open={openHelp} onClose={() => setOpenHelp(false)}>
        <DialogTitle>Como funciona?</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Esta calculadora de dividendos permite simular o investimento necessário para atingir sua meta de dividendos mensais. Ela distribui o investimento entre os fundos cadastrados de forma proporcional, considerando a relação dividendo/preço.
          </Typography>
          <Typography gutterBottom>
            Preencha os campos com os valores desejados: insira a meta de dividendos, nome da carteira e os dados dos fundos (nome, dividendo e preço). Os dados dos fundos serão utilizados para calcular a quantidade de cotas necessárias.
          </Typography>
          <Typography gutterBottom>
            Você pode salvar as configurações no navegador, pois as informações são armazenadas localmente e nada é enviado para nossos servidores.
          </Typography>
          <Typography gutterBottom>
            Após inserir os dados, clique em "Calcular" para ver o investimento total e o valor de dividendos esperado. Use esses resultados para planejar melhor seus investimentos, e distribuir suas aplicações igualmente nos fundos de sua carteira.
          </Typography>
          <Typography gutterBottom>
            Aviso: a calculadora não deve ser considerada como recomendação de investimento. Consulte um especialista antes de tomar decisões financeiras.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelp(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
