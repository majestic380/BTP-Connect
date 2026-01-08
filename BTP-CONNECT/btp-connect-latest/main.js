const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require('os');

// A5: deterministic userData (optional)
// Allows QA/CI to run without polluting the user's real profile.
// If BTP_USERDATA_DIR is set, config/runtime files are stored there.
if (process.env.BTP_USERDATA_DIR && process.env.BTP_USERDATA_DIR.trim()) {
  try {
    app.setPath('userData', process.env.BTP_USERDATA_DIR.trim());
  } catch (e) {
    // If this fails, we fall back to Electron defaults.
    console.error('[BTP Connect] Failed to override userData dir:', e);
  }
}

// Flags
const isSilent = process.argv.includes("--silent");
const isMinimized = process.argv.includes("--minimized");

// ========== A2: App config (non-secret) ==========
// Stored in userData to stay out of the application folder.
// Changes are applied on next boot (relaunch controlled).

const DEFAULT_CONFIG = {
  mode: "local", // local | lan | cloud
  apiUrl: "http://127.0.0.1:3000",
  backendPort: 3000,
  lanExpose: false,
};

let currentConfig = { ...DEFAULT_CONFIG };
let resolvedBackendUrl = DEFAULT_CONFIG.apiUrl;

let mainWindow;
let backendProc = null;

function getConfigPath() {
  return path.join(app.getPath("userData"), "app.config.json");
}

function readConfig() {
  const cfgPath = getConfigPath();
  try {
    if (!fs.existsSync(cfgPath)) {
      fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
      fs.writeFileSync(cfgPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(cfgPath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error("[BTP Connect] Failed to read config, using defaults:", e);
    return { ...DEFAULT_CONFIG };
  }
}

function validateAndMergeConfig(partial) {
  const next = { ...currentConfig };
  if (partial && typeof partial === "object") {
    if (typeof partial.mode === "string") {
      const m = partial.mode.toLowerCase();
      if (!["local", "lan", "cloud"].includes(m)) {
        throw new Error("Invalid mode. Expected local|lan|cloud");
      }
      next.mode = m;
    }
    if (partial.apiUrl !== undefined) {
      if (typeof partial.apiUrl !== "string" || !partial.apiUrl.trim()) {
        throw new Error("Invalid apiUrl");
      }
      next.apiUrl = partial.apiUrl.trim();
    }
    if (partial.backendPort !== undefined) {
      const p = Number(partial.backendPort);
      if (!Number.isInteger(p) || p < 1 || p > 65535) {
        throw new Error("Invalid backendPort");
      }
      next.backendPort = p;
    }
    if (partial.lanExpose !== undefined) {
      next.lanExpose = !!partial.lanExpose;
    }
  }
  return next;
}

function writeConfig(nextCfg) {
  const cfgPath = getConfigPath();
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify(nextCfg, null, 2) + os.EOL, "utf-8");
}

function startBackendBestEffort() {
  // Only start backend automatically for local/lan modes.
  if (currentConfig.mode === "cloud") {
    console.log("[BTP Connect] Cloud mode: backend auto-start disabled.");
    return;
  }

  // We only auto-start if we can find a built backend entrypoint.
  const backendDir = path.join(__dirname, "backend");
  const builtEntry = path.join(backendDir, "dist", "server.js");

  if (!fs.existsSync(builtEntry)) {
    console.log("[BTP Connect] Backend not started automatically (missing backend/dist/server.js).");
    console.log("[BTP Connect] To enable auto-start, run: cd backend && npm install && npm run prisma:generate && npm run prisma:migrate && npm run build");
    return;
  }

  if (backendProc) return;

  const bindHost = (currentConfig.mode === "lan" && currentConfig.lanExpose) ? "0.0.0.0" : "127.0.0.1";
  if (currentConfig.mode === "lan") {
    console.log(`[BTP Connect] LAN mode: lanExpose=${currentConfig.lanExpose} (HOST=${bindHost})`);
  }

  backendProc = spawn(process.execPath, [builtEntry], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(currentConfig.backendPort),
      // A3: LAN exposure is ONLY enabled when mode=lan AND lanExpose=true.
      HOST: bindHost,
      BTP_MODE: currentConfig.mode,
    },
    stdio: "inherit"
  });

  backendProc.on("exit", (code, signal) => {
    console.log(`[BTP Connect] Backend exited (code=${code}, signal=${signal}).`);
    backendProc = null;
  });
}

function computeBackendUrl() {
  if (currentConfig.mode === "cloud") {
    resolvedBackendUrl = currentConfig.apiUrl;
    return;
  }
  // local/lan: renderer targets local backend.
  resolvedBackendUrl = `http://127.0.0.1:${currentConfig.backendPort}`;
}

function stopBackend() {
  if (!backendProc) return;
  try {
    backendProc.kill();
  } catch (e) {
    // ignore
  }
  backendProc = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: !isSilent && !isMinimized,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load local UI
  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));

  if (isMinimized) mainWindow.minimize();
  // If silent: keep running in background (window hidden)
}

// ========== IPC (A2) ==========
ipcMain.handle('btp:config:get', async () => {
  return { ...currentConfig };
});

ipcMain.handle('btp:config:set', async (_evt, partial) => {
  const next = validateAndMergeConfig(partial);
  writeConfig(next);
  currentConfig = next;
  computeBackendUrl();
  return { ok: true, config: { ...currentConfig } };
});

ipcMain.handle('btp:backendUrl:get', async () => {
  return resolvedBackendUrl;
});

ipcMain.handle('btp:app:relaunch', async () => {
  // Controlled restart: apply new mode/config on next boot.
  app.relaunch();
  app.exit(0);
  return { ok: true };
});

app.whenReady().then(() => {
  currentConfig = readConfig();
  computeBackendUrl();
  startBackendBestEffort();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  stopBackend();
});

app.on("window-all-closed", () => {
  // On macOS it's common to keep the app open until user quits explicitly
  if (process.platform !== "darwin") app.quit();
});
