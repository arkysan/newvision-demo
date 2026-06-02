// Minimal probe — full logic added once route is confirmed live
module.exports = async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, probe: true }));
};
