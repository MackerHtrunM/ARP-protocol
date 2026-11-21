// GitHub Pages cannot run Python. The browser sends quiz scoring requests to
// the Python API deployed from render.yaml. Keep the rest of the site static.
window.ARP_API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8001"
  : "https://arp-protocol-api.onrender.com";
