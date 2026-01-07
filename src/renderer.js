document.getElementById("btnPing").addEventListener("click", async () => {
  const res = await window.btp.ping();
  document.getElementById("out").textContent = JSON.stringify(res, null, 2);
});
