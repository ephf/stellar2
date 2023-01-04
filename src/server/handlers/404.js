export function handle404(req, res) {
  res.status(404).send(`Cannot ${req.method} ${req.url}`);
}
