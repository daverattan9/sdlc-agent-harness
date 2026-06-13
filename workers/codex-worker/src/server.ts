import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/jobs', (_req, res) => {
  res.json({ message: 'Job received — stub implementation' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Codex worker listening on port ${PORT}`);
});
