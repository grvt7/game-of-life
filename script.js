const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const sw = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w"),
  );
  const th = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"),
  );
  const bh = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--bottombar-h",
    ),
  );
  canvas.width = window.innerWidth - 2 * sw;
  canvas.height = window.innerHeight - th - bh;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
