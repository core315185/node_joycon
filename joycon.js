const HID = require("node-hid");
const robots = require("robotjs");

const VID = 0x057e; // Nintendo
const PID_L = 0x2006; // Joy-Con L
const PID_R = 0x2007; // Joy-Con R

const BUTTON_BITS = {
  "Y": 0x01,
  "X": 0x02,
  "B": 0x04,
  "A": 0x08,
  "R": 0x40,
  "L": 0x80
  // 必要に応じて増やしてください
};

const devInfo = HID.devices().find(
  (d) => d.vendorId === VID && (d.productId === PID_R ||  d.productId === PID_L)
);
if (!devInfo) {
  console.error(
    "Joy-Conが見つかりません。Bluetooth ペアリングを確認してください。"
  );
  process.exit(1);
}

/* --- 出力レポート 0x01（Sub-command）生成ユーティリティ --- */
let pkt = 0;
const RUMBLE_OFF = Buffer.from([0, 1, 0x40, 0x40, 0, 1, 0x40, 0x40]); // 8 byte 固定

function makeSubCmd(id, data = Buffer.alloc(0)) {
  const buf = Buffer.alloc(10 + data.length);
  buf[0] = 0x01; // Report ID
  buf[1] = pkt++ & 0x0f; // Packet counter (0-15)
  RUMBLE_OFF.copy(buf, 2);
  buf[10] = id; // Sub-command ID
  data.copy(buf, 11);
  return buf;
}

/* --- 本体 --- */
const joycon = new HID.HID(devInfo.path);

/* 0x03: Set input-report mode → 0x30 (標準フルレポート 60 Hz) */
joycon.write([...makeSubCmd(0x03, Buffer.from([0x30]))]);
console.log("🎮 Joy-Con R 接続完了。A/B 押下を監視中…");

/* 直前の A/B 状態を保持 */
let prev = 0;

joycon.on("data", (buf) => {
  if (buf[0] !== 0x30) return;
  const buttons = buf[3];

  const now = buttons & 0x0f;
  const rising = ~prev & now; // 押下関連のフラグ
  if (rising & BUTTON_BITS['A']) {
    robots.keyTap('a');
    console.log("A ボタン押下");
  }
  if (rising & BUTTON_BITS['B']) {
    robots.keyTap('b');
    console.log("B ボタン押下");
  }
  if (rising & BUTTON_BITS['X']) {
    robots.keyTap('x');
    console.log("X ボタン押下");
  }
  if (rising & BUTTON_BITS['Y']) {
    robots.keyTap('y');
    console.log("Y ボタン押下");
  }
  if (rising & BUTTON_BITS['R']) {
    robots.keyTap('r');
    console.log("R ボタン押下");
  }
  if (rising & BUTTON_BITS['L']) {
    robots.keyTap('l');
    console.log("L ボタン押下");
  }
  prev = now;
});

joycon.on("error", (err) => console.error("HID エラー:", err));



