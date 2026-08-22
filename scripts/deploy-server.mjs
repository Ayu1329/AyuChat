import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "deploy.config.json");

if (!existsSync(configPath)) {
  console.error("缺少 deploy.config.json，请复制 deploy.config.example.json 并填写服务器信息。");
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const useShell = process.platform === "win32";

function run(label, command, args, options = {}) {
  console.log(`\n==> ${label}`);
  console.log(`> ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: options.cwd ?? root,
    shell: options.shell ?? false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("构建服务端", "pnpm", ["server:build"], { shell: useShell });

const jarPath = join(root, "server", "target", config.jarName);
if (!existsSync(jarPath)) {
  console.error(`未找到 JAR：${jarPath}`);
  process.exit(1);
}

const remote = `${config.user}@${config.host}`;
const remoteDir = config.remoteDir;
const remoteJar = `${remoteDir}/${config.jarName}`;
const remoteSetup = `${remoteDir}/setup-service.sh`;

const setupScript = `#!/bin/bash
set -euo pipefail
cd "${remoteDir}"

JAVA_BIN="$(command -v java)"
if [ -z "$JAVA_BIN" ]; then
  echo "未找到 java，请先安装 JDK 17"
  exit 1
fi

cat > /etc/systemd/system/ayuchat.service <<EOF
[Unit]
Description=AyuChat Server
After=network.target

[Service]
Type=simple
WorkingDirectory=${remoteDir}
ExecStart=$JAVA_BIN -jar ${remoteDir}/${config.jarName} --spring.profiles.active=${config.springProfile} --server.port=${config.serverPort}
Restart=always
RestartSec=5
SuccessExitStatus=143
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

if [ -f ayuchat.pid ]; then
  kill "$(cat ayuchat.pid)" 2>/dev/null || true
  rm -f ayuchat.pid
fi
pgrep -f "java -jar ${config.jarName}" | xargs -r kill || true
sleep 1

systemctl daemon-reload
systemctl enable ayuchat
systemctl restart ayuchat

for i in $(seq 1 30); do
  if systemctl is-active --quiet ayuchat && journalctl -u ayuchat -n 80 --no-pager | grep -q "Started AyuChatApplication"; then
    echo "部署成功：服务已启动，并已设置开机自启"
    systemctl --no-pager --full status ayuchat | head -20
    exit 0
  fi
  sleep 1
done

echo "启动可能失败："
systemctl --no-pager --full status ayuchat | head -30
journalctl -u ayuchat -n 40 --no-pager
exit 1
`;

const tmpDir = join(root, "scripts", ".tmp");
mkdirSync(tmpDir, { recursive: true });
const localSetup = join(tmpDir, "setup-service.sh");
writeFileSync(localSetup, setupScript.replace(/\r\n/g, "\n"), "utf8");

run("上传 JAR", "scp", ["-P", String(config.port), jarPath, `${remote}:${remoteJar}`]);
run("上传 systemd 安装脚本", "scp", [
  "-P",
  String(config.port),
  localSetup,
  `${remote}:${remoteSetup}`,
]);
run("安装并启动服务", "ssh", [
  "-p",
  String(config.port),
  remote,
  `bash ${remoteSetup}`,
]);

console.log(`\n完成。服务会开机自启，崩溃也会自动重启。`);
console.log(`API: http://${config.host}:${config.serverPort}`);
