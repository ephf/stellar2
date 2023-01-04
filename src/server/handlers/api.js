export function handleAPI(page, req, res) {
  if (page.default) {
    page.default(req, res);
    return;
  }

  const ping = page[req.method];
  if (!ping) {
    res.status(404).send(`Cannot ${req.method} ${req.url}`);
    return;
  }
  ping(req, res);
  return;
}
