
// ============================================================
// 樂器博物館：完整修正版
// 修改重點：
// 1. 中央展示框維持原本大小
// 2. 中央樂器插畫放大
// 3. 表情改成獨立的奶白色圓形臉部，避免與樂器細節混在一起
// 4. 普通笑臉、哭哭、開心笑臉三種表情
// 5. 答錯時整個畫面震動一下，正確選項也會上下晃動
// 6. 答對時中央樂器開心蹦跳並出現彩帶
// 7. 成績頁維持兩欄四列，只能垂直捲動
// ============================================================


// ==================== 一、顏色 ====================

const BLUE = "#70D6FF";
const PINK = "#FF70A6";
const BTN_COLOR = "#E9FF70";
const BG = "#FFF8EF";
const INK = "#51445D";
const WHITE = "#FFFFFF";
const PURPLE = "#B9A0FF";
const MUTED = "#8A7C96";
const PALE = "#F4EEF9";
const FACE_COLOR = "#FFF8E8";


// ==================== 二、遊戲變數 ====================

let page = "cover";
let currentQuestion = 0;
let score = 0;
let answers = [];
let selectedAnswer = -1;
let hasAnswered = false;

let questions = [];
let optionRects = [];
let confetti = [];
let shakeAmount = 0; // 答錯時整個畫面的震動幅度

let scrollY = 0;
let maxScroll = 0;
let contentHeight = 0;

let startButton = {};
let nextButton = {};
let resultButton = {};
let retryButton = {};

// ==================== 音訊變數 ====================
// 八個 MP3 放在 media 資料夾，檔名必須與下方完全一致。
let instrumentSounds = [];
let currentlyPlayingSound = null;
let quizAudioButton = {};
let resultAudioButtons = Array(8).fill(null);
const instrumentAudioPaths = [
  "media/打鼓.mp3",
  "media/沙鈴.mp3",
  "media/小木琴.mp3",
  "media/鈴鼓.mp3",
  "media/吉他.mp3",
  "media/小提琴.mp3",
  "media/長笛.mp3",
  "media/小號.mp3"
];

let flipProgress = Array(8).fill(0);


// ==================== 三、樂器資料 ====================

const instruments = [
  {
    name: "鼓",
    type: "drum",
    appearance: "鼓通常有圓圓的鼓面和中空的鼓身。",
    sound: "用鼓棒敲擊鼓面，就會發出咚咚的聲音。"
  },
  {
    name: "沙鈴",
    type: "maracas",
    appearance: "沙鈴常有圓圓的頭和細長的握柄。",
    sound: "搖動沙鈴時，裡面的小顆粒會發出沙沙聲。"
  },
  {
    name: "木琴",
    type: "xylophone",
    appearance: "木琴有一排長短不同的木條。",
    sound: "用小槌敲擊木條，可以聽到清脆的不同音高。"
  },
  {
    name: "鈴鼓",
    type: "tambourine",
    appearance: "鈴鼓有圓形的框，上面裝著小金屬鈴片。",
    sound: "搖動或拍打鈴鼓，會發出清亮的鈴鈴聲。"
  },
  {
    name: "吉他",
    type: "guitar",
    appearance: "吉他有圓圓的琴身、細長的琴頸和許多琴弦。",
    sound: "用手撥動琴弦，就能發出不同的音高。"
  },
  {
    name: "小提琴",
    type: "violin",
    appearance: "小提琴有弧形的琴身、細長的琴頸和四條琴弦。",
    sound: "通常用琴弓摩擦琴弦，發出悠揚的聲音。"
  },
  {
    name: "長笛",
    type: "flute",
    appearance: "長笛是一種細長的管樂器，身上有許多按鍵。",
    sound: "演奏者把氣吹過吹口，就能吹出清亮的聲音。"
  },
  {
    name: "小號",
    type: "trumpet",
    appearance: "小號有彎曲的金屬管、按鍵和張開的喇叭口。",
    sound: "演奏者用嘴唇振動吹氣，發出明亮響亮的聲音。"
  }
];


// ==================== 四、載入音訊 ====================

// p5.sound.min.js 必須在 sketch.js 之前載入，否則 loadSound 無法使用。
function preload() {
  for (let i = 0; i < instrumentAudioPaths.length; i++) {
    instrumentSounds[i] = loadSound(instrumentAudioPaths[i]);
  }
}

// 播放指定樂器的聲音；點新喇叭時先停止上一段聲音。
function playInstrumentSound(index) {
  const sound = instrumentSounds[index];
  if (!sound || !sound.isLoaded()) {
    console.warn("音訊尚未載入，請檢查檔名與 media 資料夾：", instrumentAudioPaths[index]);
    return;
  }

  if (currentlyPlayingSound && currentlyPlayingSound.isPlaying()) {
    currentlyPlayingSound.stop();
  }

  userStartAudio();
  sound.play();
  currentlyPlayingSound = sound;
}

// 停止目前播放中的音訊。
function stopInstrumentSound() {
  if (currentlyPlayingSound && currentlyPlayingSound.isPlaying()) {
    currentlyPlayingSound.stop();
  }
  currentlyPlayingSound = null;
}

// ==================== 四、初始化 ====================

function setup() {
  // 清除瀏覽器預設邊界，避免水平捲動
  document.documentElement.style.margin = "0";
  document.documentElement.style.padding = "0";
  document.documentElement.style.overflowX = "hidden";

  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflowX = "hidden";
  document.body.style.overflowY = "hidden";

  // 畫布寬度配合視窗
  let canvas = createCanvas(
    document.documentElement.clientWidth,
    windowHeight
  );

  canvas.style("display", "block");
  canvas.style("max-width", "100%");
  canvas.style("overflow", "hidden");

  textFont("Arial");
  textAlign(CENTER, CENTER);

  setupQuestions();
}


// 視窗尺寸改變時重新調整畫布
function windowResized() {
  resizeCanvas(
    document.documentElement.clientWidth,
    windowHeight
  );

  scrollY = constrain(scrollY, 0, maxScroll);
}


// ==================== 五、建立題目 ====================

function setupQuestions() {
  // 每種樂器各作為一次正確答案
  questions = instruments.map((instrument, index) => {
    let choices = [index];

    // 加入三個不重複的錯誤選項
    while (choices.length < 4) {
      let candidate = floor(random(instruments.length));

      if (!choices.includes(candidate)) {
        choices.push(candidate);
      }
    }

    // 隨機打亂選項
    shuffle(choices, true);

    return {
      answer: index,
      choices: choices
    };
  });
}


// ==================== 六、主繪圖函式 ====================

function draw() {
  background(BG);

  // 答錯時短暫震動整個畫面
  push();
  if (shakeAmount > 0) {
    translate(
      random(-shakeAmount, shakeAmount),
      random(-shakeAmount, shakeAmount)
    );
    shakeAmount *= 0.75;
    if (shakeAmount < 0.5) shakeAmount = 0;
  }

  drawBackgroundDecor();

  if (page === "cover") {
    drawCover();
  } else if (page === "quiz") {
    drawQuiz();
  } else if (page === "result") {
    drawResult();
  }

  drawConfetti();
  pop();
}


// ==================== 七、背景裝飾 ====================

function drawBackgroundDecor() {
  noStroke();

  fill("#E7F8FF");
  circle(width * 0.04, height * 0.18, 90);
  circle(width * 0.96, height * 0.75, 110);

  fill("#FFF0F5");
  circle(width * 0.08, height * 0.86, 75);
  circle(width * 0.92, height * 0.12, 65);

  // 背景星星緩慢旋轉
  for (let i = 0; i < 10; i++) {
    let x = 30 + (i * 173) % max(1, width - 60);
    let y = 25 + (i * 109) % max(1, height - 50);

    push();
    translate(x, y);
    rotate(sin(frameCount * 0.02 + i) * 0.2);

    fill(i % 2 === 0 ? "#FFD166" : PURPLE);
    drawStar(0, 0, 4, 9, 4);

    pop();
  }
}


// 繪製星星
function drawStar(x, y, innerR, outerR, points) {
  beginShape();

  for (let i = 0; i < points * 2; i++) {
    let angle = -HALF_PI + i * PI / points;
    let radius = i % 2 === 0 ? outerR : innerR;

    vertex(
      x + cos(angle) * radius,
      y + sin(angle) * radius
    );
  }

  endShape(CLOSE);
}


// ==================== 八、通用按鈕 ====================

function drawButton(x, y, w, h, label) {
  let hovering =
    mouseX >= x && mouseX <= x + w &&
    mouseY >= y && mouseY <= y + h;

  push();

  // 使用按鈕中心作為原點
  translate(x + w / 2, y + h / 2);

  // 滑鼠移入時稍微放大
  scale(hovering ? 1.025 : 1);

  // 陰影
  noStroke();
  fill("#51445D22");
  rect(-w / 2 + 3, -h / 2 + 5, w, h, 22);

  // 按鈕本體
  fill(BTN_COLOR);
  rect(-w / 2, -h / 2, w, h, 22);

  // 每次重新設定文字對齊，避免文字跑位
  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(h * 0.34, 15, 23));
  text(label, 0, 0);

  pop();
}


// ==================== 九、封面 ====================

function drawCover() {
  let cx = width / 2;
  let cy = height / 2;

  let cardW = min(width * 0.90, 760);
  let cardH = min(height * 0.78, 560);

  // 白色封面底板
  fill(WHITE);
  noStroke();
  rect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 35);

  // 英文標籤
  fill(BLUE);
  rect(cx - 92, cy - cardH / 2 + 24, 184, 34, 17);

  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(15);
  text("WELCOME TO MUSIC", cx, cy - cardH / 2 + 41);

  // 左邊的木琴
  push();
  translate(cx - cardW * 0.30, cy - 45);
  rotate(sin(frameCount * 0.035) * 0.08);
  drawInstrument("xylophone", 0, 0, 0.55, "normal");
  pop();

  // 右邊的吉他
  push();
  translate(cx + cardW * 0.30, cy - 45);
  rotate(sin(frameCount * 0.035 + PI) * 0.08);
  drawInstrument("guitar", 0, 0, 0.52, "normal");
  pop();

  // 標題輕輕搖擺
  push();
  translate(cx, cy - 88);
  rotate(sin(frameCount * 0.035) * 0.025);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width * 0.085, 62));

  fill("#FFB347");
  text("樂器博物館", 2, 3);

  fill(INK);
  text("樂器博物館", 0, 0);

  pop();

  fill(MUTED);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(min(20, width * 0.045));
  text("聽聽聲音，認識樂器！", cx, cy - 20);

  let buttonW = min(250, width * 0.65);
  let buttonH = 58;

  startButton = {
    x: cx - buttonW / 2,
    y: cy + 34,
    w: buttonW,
    h: buttonH
  };

  drawButton(
    startButton.x,
    startButton.y,
    startButton.w,
    startButton.h,
    "進入遊戲  ▶"
  );

  fill(MUTED);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("共 8 道題目 · 一起來挑戰吧！", cx, cy + 112);
}


// ==================== 十、題目頁 ====================

function drawQuiz() {
  push();

  // 整頁只依照捲動位置上下移動
  translate(0, -scrollY);

  let q = questions[currentQuestion];
  let instrument = instruments[q.answer];

  // 標題
  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.04, 23, 30));
  text("樂器猜猜看！", width / 2, 35);

  drawProgress();

  fill(MUTED);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);
  text(
    "第 " + (currentQuestion + 1) + " 題 / 共 8 題",
    width / 2,
    98
  );

  // 中央展示框的大小保持不變
  let cardW = min(width * 0.66, 420);
  let cardH = constrain(height * 0.28, 160, 215);
  let cardY = 120;

  fill(WHITE);
  noStroke();
  rect(width / 2 - cardW / 2, cardY, cardW, cardH, 28);

  // 決定中央樂器的表情
  let faceMood = "normal";
  let bounceHeight = 0;

  if (hasAnswered && answers[currentQuestion]) {
    // 答對：笑得更開心並蹦跳
    faceMood = "happy";
    bounceHeight = abs(sin(frameCount * 0.22)) * 15;
  } else if (hasAnswered && !answers[currentQuestion]) {
    // 答錯：哭哭表情，但不移動
    faceMood = "cry";
  }

  // 只放大中央樂器，不放大展示框
  // 原本是 0.75，現在改成 1.05
  // 插畫會更醒目，但底框大小完全不變
  push();

  translate(
    width / 2,
    cardY + cardH * 0.55 - bounceHeight
  );

  drawInstrument(
    instrument.type,
    0,
    0,
    1.05,
    faceMood
  );

  pop();

  // 題目提示
  fill(MUTED);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(15);
  text(
    "請選出這個樂器的名稱",
    width / 2,
    cardY + cardH + 18
  );

  drawOptions(q);

  // 答題後顯示介紹
  if (hasAnswered) {
    drawFeedback(instrument);
  }

  // 以固定選項座標計算內容高度
  let optionBottom = optionRects.length
    ? max(...optionRects.map(r => r.y + r.h))
    : 450;

  let feedbackBottom = hasAnswered
    ? (currentQuestion === 7
        ? resultButton.y + resultButton.h
        : nextButton.y + nextButton.h)
    : optionBottom;

  contentHeight = max(optionBottom, feedbackBottom) + 30;
  maxScroll = max(0, contentHeight - height + 15);

  pop();

  // 答題頁喇叭固定在畫面右上角，不會隨內容捲動。
  quizAudioButton = {
    x: width - 58,
    y: 16,
    w: 42,
    h: 42
  };
  drawSpeakerButton(quizAudioButton);
}


// ==================== 十一、進度表 ====================

function drawProgress() {
  let totalW = min(width * 0.82, 580);
  let gap = 7;
  let segmentW = (totalW - gap * 7) / 8;
  let x0 = width / 2 - totalW / 2;
  let y = 64;

  for (let i = 0; i < 8; i++) {
    let x = x0 + i * (segmentW + gap);
    let color = "#E9E2EC";

    if (answers[i] !== undefined) {
      color = answers[i] ? BLUE : PINK;
    } else if (i === currentQuestion) {
      color = "#FFE66D";
    }

    noStroke();
    fill(color);
    rect(x, y, segmentW, 9, 5);
  }
}


// ==================== 十二、四個答案選項 ====================

function drawOptions(q) {
  optionRects = [];

  // 窄螢幕使用單欄，寬螢幕使用兩欄
  let cols = width < 520 ? 1 : 2;

  let gap = 12;
  let margin = min(width * 0.07, 45);
  let availableW = width - margin * 2;

  let w = cols === 1
    ? availableW
    : min((availableW - gap) / 2, 280);

  let h = 52;
  let totalW = cols === 1 ? w : w * 2 + gap;
  let startX = width / 2 - totalW / 2;

  let cardH = constrain(height * 0.28, 160, 215);
  let startY = 120 + cardH + 43;

  for (let i = 0; i < 4; i++) {
    let col = i % cols;
    let row = floor(i / cols);

    let x = startX + col * (w + gap);
    let y = startY + row * (h + 10);

    let instrumentIndex = q.choices[i];
    let label = instruments[instrumentIndex].name;

    let color = WHITE;
    let visualOffsetY = 0;

    if (hasAnswered) {
      // 正確選項顯示藍色
      if (instrumentIndex === q.answer) {
        color = BLUE;

        // 只有答錯時，正確選項才上下晃動
        if (!answers[currentQuestion]) {
          visualOffsetY = sin(frameCount * 0.22) * 6;
        }
      }

      // 選錯的選項顯示粉紅色
      if (
        !answers[currentQuestion] &&
        selectedAnswer === i
      ) {
        color = PINK;
      }
    }

    // 選項陰影
    noStroke();
    fill("#51445D14");
    rect(
      x + 2,
      y + 3 + visualOffsetY,
      w,
      h,
      15
    );

    // 選項本體
    fill(color);
    stroke("#E6DDEB");
    strokeWeight(1);
    rect(
      x,
      y + visualOffsetY,
      w,
      h,
      15
    );

    // 選項文字
    fill(INK);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(constrain(w * 0.065, 16, 21));

    text(
      label,
      x + w / 2,
      y + h / 2 + visualOffsetY
    );

    // 點擊區域使用固定座標
    // 動畫不會影響介紹欄或其他按鈕的位置
    optionRects.push({
      x: x,
      y: y,
      w: w,
      h: h,
      index: i
    });
  }
}


// ==================== 十三、答題介紹欄 ====================

function drawFeedback(instrument) {
  let boxW = min(width * 0.88, 650);
  let boxH = 225;

  let x = (width - boxW) / 2;

  // 介紹欄位置只依照固定選項座標計算
  let optionBottom = max(
    ...optionRects.map(r => r.y + r.h)
  );

  let y = optionBottom + 20;

  // 底層淡紫色卡片
  noStroke();
  fill(PALE);
  rect(x, y, boxW, boxH, 25);

  // 半透明白色覆層
  fill(255, 255, 255, 128);
  rect(x, y, boxW, boxH, 25);

  // 標題
  fill(INK);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(constrain(boxW * 0.035, 18, 23));

  let titleText =
    (answers[currentQuestion] ? "答對了！" : "正確答案：") +
    instrument.name;

  text(titleText, x + 22, y + 27);

  // 分隔線
  stroke("#DCD0E8");
  strokeWeight(1);
  line(x + 20, y + 49, x + boxW - 20, y + 49);
  noStroke();

  // 外觀標題
  fill(INK);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(constrain(boxW * 0.027, 15, 18));
  text("外觀是什麼樣子？", x + 22, y + 71);

  // 外觀文字
  drawClippedText(
    instrument.appearance,
    x + 22,
    y + 86,
    boxW - 44,
    38,
    constrain(boxW * 0.026, 15, 18),
    INK
  );

  // 聲音標題
  fill(INK);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(constrain(boxW * 0.027, 15, 18));
  text("會發出什麼聲音？", x + 22, y + 145);

  // 聲音文字
  drawClippedText(
    instrument.sound,
    x + 22,
    y + 161,
    boxW - 44,
    43,
    constrain(boxW * 0.026, 15, 18),
    INK
  );

  // 下一題或看成績按鈕
  let btnW = min(220, width * 0.62);
  let btnH = 48;
  let buttonY = y + boxH + 14;

  if (currentQuestion === 7) {
    resultButton = {
      x: (width - btnW) / 2,
      y: buttonY,
      w: btnW,
      h: btnH
    };

    drawButton(
      resultButton.x,
      resultButton.y,
      resultButton.w,
      resultButton.h,
      "看成績  ✦"
    );
  } else {
    nextButton = {
      x: (width - btnW) / 2,
      y: buttonY,
      w: btnW,
      h: btnH
    };

    drawButton(
      nextButton.x,
      nextButton.y,
      nextButton.w,
      nextButton.h,
      "下一題  →"
    );
  }
}


// ==================== 十四、文字裁切 ====================

function drawClippedText(
  content,
  x,
  y,
  w,
  h,
  fontSize,
  color
) {
  drawingContext.save();

  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();

  push();

  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(fontSize);
  fill(color);
  noStroke();

  text(content, x, y, w, h);

  pop();

  drawingContext.restore();
}
function drawResult() {
  push();
  translate(0, -scrollY);

  let cx = width / 2;

  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.055, 27, 38));
  text("闖關完成！", cx, 42);

  fill(MUTED);
  textStyle(NORMAL);
  textSize(constrain(width * 0.024, 13, 17));
  text("把滑鼠移到卡片上，看看樂器介紹", cx, 76);

  // 分數卡片
  let scoreW = min(width * 0.82, 420);

  fill(WHITE);
  noStroke();
  rect(cx - scoreW / 2, 105, scoreW, 76, 22);

  fill(BLUE);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(27);
  text("答對 " + score + " / 8 題", cx, 143);

  // 固定兩欄四列，並預留外側空間放喇叭，確保喇叭在卡片外面。
  let gap = 16;
  let speakerSize = 38;
  let speakerGap = 8;
  let sideSpace = speakerSize + speakerGap + 4;

  let cardSize = min(
    210,
    (width - sideSpace * 2 - gap) / 2
  );
  cardSize = max(70, cardSize);

  let totalW = cardSize * 2 + gap;
  let startX = (width - totalW) / 2;
  let startY = 205;

  for (let i = 0; i < 8; i++) {
    let col = i % 2;
    let row = floor(i / 2);

    let x = startX + col * (cardSize + gap);
    let y = startY + row * (cardSize + gap);
    let actualMouseY = mouseY + scrollY;

    // 喇叭分別放在每張圖卡的外側：左欄靠左，右欄靠右。
    let speakerX = col === 0
      ? x - speakerSize - speakerGap
      : x + cardSize + speakerGap;

    let speaker = {
      x: speakerX,
      y: y + cardSize / 2 - speakerSize / 2,
      w: speakerSize,
      h: speakerSize,
      instrumentIndex: i
    };
    resultAudioButtons[i] = speaker;

    // 先判斷滑鼠是否在喇叭上。喇叭區域不可以觸發卡片翻面。
    let hoveringSpeaker =
      mouseX >= speaker.x &&
      mouseX <= speaker.x + speaker.w &&
      actualMouseY >= speaker.y &&
      actualMouseY <= speaker.y + speaker.h;

    let hoveringCard =
      mouseX >= x &&
      mouseX <= x + cardSize &&
      actualMouseY >= y &&
      actualMouseY <= y + cardSize;

    let hovering = hoveringCard && !hoveringSpeaker;
    let targetAngle = hovering ? PI : 0;

    flipProgress[i] = lerp(
      flipProgress[i],
      targetAngle,
      0.18
    );

    let angle = flipProgress[i];
    let overallScale = hovering ? 1.08 : 1;
    let horizontalScale = max(abs(cos(angle)), 0.04);

    push();
    translate(x + cardSize / 2, y + cardSize / 2);
    scale(horizontalScale * overallScale, overallScale);

    if (angle < HALF_PI) {
      drawResultCardFront(i, -cardSize / 2, -cardSize / 2, cardSize);
    } else {
      drawResultCardBack(i, -cardSize / 2, -cardSize / 2, cardSize);
    }
    pop();

    // 在卡片外側繪製喇叭，位置不跟著翻面或放大。
    drawSpeakerButton(speaker);
  }

  // 再來一次按鈕
  let btnW = min(250, width * 0.65);
  let btnH = 52;
  let buttonY = startY + 4 * (cardSize + gap) + 18;

  retryButton = {
    x: (width - btnW) / 2,
    y: buttonY,
    w: btnW,
    h: btnH
  };

  drawButton(
    retryButton.x,
    retryButton.y,
    retryButton.w,
    retryButton.h,
    "再來一次  ↻"
  );

  contentHeight = buttonY + btnH + 35;
  maxScroll = max(0, contentHeight - height + 20);

  pop();
}


// ==================== 十六、成績卡片正面 ====================

function drawResultCardFront(index, x, y, size) {
  let instrument = instruments[index];
  let color = answers[index] ? BLUE : PINK;

  fill(color);
  stroke(WHITE);
  strokeWeight(2);
  rect(x, y, size, size, 20);

  // 半透明白色內框
  noStroke();
  fill(255, 255, 255, 175);
  rect(
    x + 7,
    y + 7,
    size - 14,
    size - 14,
    15
  );

  // 卡片上的樂器插畫與表情
  push();
  translate(x + size / 2, y + size * 0.42);

  drawInstrument(
    instrument.type,
    0,
    0,
    min(size / 180, 0.64),
    "normal"
  );

  pop();

  fill(INK);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(size * 0.12, 16, 23));
  text(instrument.name, x + size / 2, y + size * 0.81);
}


// ==================== 十七、成績卡片背面 ====================

function drawResultCardBack(index, x, y, size) {
  let instrument = instruments[index];

  fill(WHITE);
  stroke(answers[index] ? BLUE : PINK);
  strokeWeight(3);
  rect(x, y, size, size, 20);

  noStroke();
  fill(PALE);
  rect(
    x + 7,
    y + 7,
    size - 14,
    size - 14,
    15
  );

  let pad = size * 0.085;
  let innerW = size - pad * 2;

  drawClippedText(
    instrument.name,
    x + pad,
    y + pad,
    innerW,
    size * 0.13,
    constrain(size * 0.105, 15, 21),
    INK
  );

  stroke("#DED3E8");
  strokeWeight(1);
  line(
    x + pad,
    y + size * 0.24,
    x + size - pad,
    y + size * 0.24
  );
  noStroke();

  drawClippedText(
    "外觀",
    x + pad,
    y + size * 0.28,
    innerW,
    size * 0.10,
    constrain(size * 0.085, 13, 17),
    "#8A719B"
  );

  drawClippedText(
    instrument.appearance,
    x + pad,
    y + size * 0.39,
    innerW,
    size * 0.22,
    constrain(size * 0.073, 12, 16),
    INK
  );

  drawClippedText(
    "聲音",
    x + pad,
    y + size * 0.63,
    innerW,
    size * 0.10,
    constrain(size * 0.085, 13, 17),
    "#8A719B"
  );

  drawClippedText(
    instrument.sound,
    x + pad,
    y + size * 0.74,
    innerW,
    size * 0.19,
    constrain(size * 0.073, 12, 16),
    INK
  );
}


// ==================== 十八、樂器插畫 ====================

// mood：normal 普通笑臉
//       cry    哭哭
//       happy  開心笑臉
//
// 先畫樂器本體，再在獨立圓形底板上畫表情。
// 圓形底板與樂器使用不同顏色，讓五官更清楚。

function drawInstrument(type, x, y, s, mood = "normal") {
  push();

  translate(x, y);
  scale(s);

  stroke(INK);
  strokeWeight(3);
  strokeJoin(ROUND);
  strokeCap(ROUND);

  // ---------- 鼓 ----------

  if (type === "drum") {
    fill("#FF9F68");
    rect(-55, -35, 110, 75, 12);

    fill("#FFD8B4");
    ellipse(0, -35, 110, 28);

    fill("#FFB9A0");
    ellipse(0, -35, 94, 19);

    stroke("#8C6B4F");
    strokeWeight(7);
    line(-36, -76, -5, -45);
    line(36, -76, 5, -45);

    noStroke();
    fill("#FFF0D7");
    circle(-36, -76, 11);
    circle(36, -76, 11);
  }

  // ---------- 沙鈴 ----------

  else if (type === "maracas") {
    push();
    rotate(-0.30);

    fill("#FF8AB5");
    ellipse(-22, -17, 45, 54);
    rect(-27, 4, 10, 55, 5);

    pop();

    push();
    rotate(0.30);

    fill("#7BDFF2");
    ellipse(22, -17, 45, 54);
    rect(17, 4, 10, 55, 5);

    pop();

    noStroke();
    fill(WHITE);
    circle(-29, -26, 7);
    circle(15, -26, 7);
  }

  // ---------- 木琴 ----------

  else if (type === "xylophone") {
    fill("#D6A36B");
    quad(-65, -8, 65, -8, 52, 27, -52, 27);

    let colors = [
      "#FF8AB5", "#FFB86C", "#FFE66D",
      "#B8F2D0", "#70D6FF", "#B9A0FF", "#F7A9A8"
    ];

    for (let i = 0; i < 7; i++) {
      let len = 30 + i * 4;
      let bx = -58 + i * 17;

      fill(colors[i]);
      rect(bx, -len / 2 - 8, 15, len, 5);
    }

    stroke("#8C6B4F");
    strokeWeight(5);
    line(-30, -60, -12, -34);
    line(30, -60, 12, -34);

    noStroke();
    fill("#8C6B4F");
    circle(-30, -60, 9);
    circle(30, -60, 9);
  }

  // ---------- 鈴鼓 ----------

  else if (type === "tambourine") {
    fill("#FFD166");
    ellipse(0, 0, 115, 115);

    fill("#FFF4DA");
    ellipse(0, 0, 77, 77);

    for (let i = 0; i < 8; i++) {
      let a = TWO_PI * i / 8;

      fill("#C0C0C0");
      ellipse(cos(a) * 47, sin(a) * 47, 18, 10);
    }

    noStroke();
    fill("#FF8AB5");
    circle(-12, -10, 9);
    circle(12, 10, 9);
  }

  // ---------- 吉他 ----------

  else if (type === "guitar") {
    fill("#E9A66D");

    beginShape();
    vertex(-18, -42);
    bezierVertex(-70, -65, -75, 4, -42, 25);
    bezierVertex(-27, 36, -23, 50, 0, 50);
    bezierVertex(23, 50, 27, 36, 42, 25);
    bezierVertex(75, 4, 70, -65, 18, -42);
    endShape(CLOSE);

    fill("#C68A54");
    rect(-10, -88, 20, 64, 5);
    rect(-13, -100, 26, 19, 5);

    fill("#6F4E37");
    circle(0, 0, 25);

    stroke("#FFF0D7");
    strokeWeight(1.5);

    for (let i = -3; i <= 3; i++) {
      line(i * 2, -93, i * 2, 45);
    }
  }

  // ---------- 小提琴 ----------

  else if (type === "violin") {
    fill("#C97842");

    beginShape();
    vertex(-12, -45);
    bezierVertex(-45, -65, -47, -20, -25, -8);
    bezierVertex(-48, 20, -32, 48, 0, 45);
    bezierVertex(32, 48, 48, 20, 25, -8);
    bezierVertex(47, -20, 45, -65, 12, -45);
    endShape(CLOSE);

    fill("#8E5634");
    rect(-7, -91, 14, 54, 4);
    ellipse(0, -95, 18, 14);

    stroke("#FFE8C8");
    strokeWeight(1.5);

    for (let i = -1; i <= 2; i++) {
      line(i * 3, -90, i * 3, 42);
    }

    stroke("#6F4E37");
    strokeWeight(3);
    line(48, -66, 60, 45);
  }

  // ---------- 長笛 ----------

  else if (type === "flute") {
    fill("#C8D9E8");
    rect(-72, -13, 144, 26, 13);

    fill("#EDF5FC");
    rect(-62, -8, 124, 7, 4);

    fill("#A8BFD3");
    rect(-65, -27, 26, 15, 5);

    for (let i = 0; i < 7; i++) {
      fill(i % 2 === 0 ? WHITE : "#B6C8DA");
      circle(-30 + i * 20, 0, 10);
    }

    fill("#8EA5BA");
    circle(70, 0, 17);
  }

  // ---------- 小號 ----------
    else if (type === "trumpet") {
    noFill();
    stroke("#E8B94F");
    strokeWeight(13);

    beginShape();
    vertex(-58, 10);
    vertex(-58, -18);
    vertex(5, -18);
    vertex(5, 20);
    vertex(-23, 20);
    vertex(-23, -2);
    endShape();

    fill("#FFD166");
    stroke(INK);
    strokeWeight(3);

    beginShape();
    vertex(4, -18);
    vertex(40, -34);
    vertex(65, -24);
    vertex(65, 24);
    vertex(40, 34);
    vertex(4, 20);
    endShape(CLOSE);

    fill("#FFF0B3");
    ellipse(62, 0, 10, 40);

    fill("#FFE8A3");

    for (let i = 0; i < 3; i++) {
      rect(-34 + i * 20, -38, 11, 20, 4);
      circle(-28 + i * 20, -39, 12);
    }
  }

  // 最後才畫獨立表情，讓五官不會被樂器線條干擾
  drawInstrumentFace(type, mood);

  pop();
}


// ==================== 十九、清楚的表情臉 ====================

// 表情改為獨立奶白色圓形臉部。
// 臉部加上外框與留白，不再直接把眼睛、嘴巴畫在琴弦或按鍵上。

function drawInstrumentFace(type, mood) {
  // 預設臉部位置
  let fx = 0;
  let fy = -24;
  let faceSize = 43;

  // 依照樂器形狀調整臉的位置
  if (type === "drum") {
    fx = 0;
    fy = -12;
    faceSize = 43;
  }

  else if (type === "maracas") {
    fx = -22;
    fy = -20;
    faceSize = 37;
  }

  else if (type === "xylophone") {
    fx = 0;
    fy = -17;
    faceSize = 40;
  }

  else if (type === "tambourine") {
    fx = 0;
    fy = 0;
    faceSize = 43;
  }

  else if (type === "guitar") {
    fx = 0;
    fy = 4;
    faceSize = 43;
  }

  else if (type === "violin") {
    fx = 0;
    fy = 4;
    faceSize = 43;
  }

  else if (type === "flute") {
    // 長笛的臉放在管子上方，避開按鍵
    fx = 0;
    fy = -36;
    faceSize = 43;
  }

  else if (type === "trumpet") {
    // 小號的臉放在左側管身上方，避開喇叭口
    fx = -28;
    fy = -12;
    faceSize = 43;
  }

  push();
    translate(fx, fy);

  // 圓形臉部的奶白色底板
  stroke("#51445D");
  strokeWeight(2.5);
  fill(FACE_COLOR);
  circle(0, 0, faceSize);

  // 五官以臉部中心為基準繪製
  // 讓每個表情的大小與位置一致
  let eyeY = -faceSize * 0.12;
  let eyeGap = faceSize * 0.23;

  // --------------------
  // 普通笑臉
  // --------------------

  if (mood === "normal") {
    // 眼睛
    noStroke();
    fill(INK);
    circle(-eyeGap, eyeY, 5.5);
    circle(eyeGap, eyeY, 5.5);

    // 微笑嘴巴
    noFill();
    stroke(INK);
    strokeWeight(3);
    arc(
      0,
      faceSize * 0.02,
      faceSize * 0.34,
      faceSize * 0.25,
      0,
      PI
    );
  }

  // --------------------
  // 哭哭表情
  // --------------------

  else if (mood === "cry") {
    // 難過的眉毛
    noFill();
    stroke(INK);
    strokeWeight(2.5);

    line(
      -eyeGap - 5,
      eyeY - 6,
      -eyeGap + 2,
      eyeY - 3
    );

    line(
      eyeGap + 5,
      eyeY - 6,
      eyeGap - 2,
      eyeY - 3
    );

    // 眼睛
    noStroke();
    fill(INK);
    circle(-eyeGap, eyeY, 5.5);
    circle(eyeGap, eyeY, 5.5);

    // 眼淚
    fill(BLUE);
    ellipse(
      -eyeGap - 5,
      eyeY + 10,
      5,
      9
    );

    ellipse(
      eyeGap + 5,
      eyeY + 10,
      5,
      9
    );

    // 向下彎的嘴巴
    noFill();
    stroke(INK);
    strokeWeight(3);

    arc(
      0,
      faceSize * 0.28,
      faceSize * 0.30,
      faceSize * 0.22,
      PI,
      TWO_PI
    );
  }

  // --------------------
  // 開心笑臉
  // --------------------

  else if (mood === "happy") {
    // 彎彎的開心眼睛
    noFill();
    stroke(INK);
    strokeWeight(3);

    arc(
      -eyeGap,
      eyeY,
      10,
      8,
      PI,
      TWO_PI
    );

    arc(
      eyeGap,
      eyeY,
      10,
      8,
      PI,
      TWO_PI
    );

    // 大大的開心嘴巴
    noStroke();
    fill(INK);

    arc(
      0,
      faceSize * 0.04,
      faceSize * 0.43,
      faceSize * 0.34,
      0,
      PI,
      CHORD
    );

    // 嘴巴裡的小舌頭
    fill(PINK);

    arc(
      0,
      faceSize * 0.12,
      faceSize * 0.20,
      faceSize * 0.12,
      0,
      PI,
      CHORD
    );
  }

  pop();
}


// ==================== 二十、彩帶動畫 ====================

function spawnConfetti() {
  confetti = [];

  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: random(width),
      y: random(-height * 0.5, 0),
      vx: random(-2.5, 2.5),
      vy: random(2, 6),
      size: random(5, 10),
      angle: random(TWO_PI),
      spin: random(-0.12, 0.12),
      color: random([
        BLUE,
        PINK,
        "#FFE66D",
        "#B8F2D0",
        "#C9B6FF",
        "#FFB347"
      ]),
      life: 255
    });
  }
}


function drawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    let p = confetti[i];

    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    p.vy += 0.035;
    p.life -= 1;

    push();

    translate(p.x, p.y);
    rotate(p.angle);

    noStroke();
    fill(p.color);
    rect(
      -p.size / 2,
      -p.size / 2,
      p.size,
      p.size * 0.65,
      2
    );

    pop();

    if (p.y > height + 20 || p.life <= 0) {
      confetti.splice(i, 1);
    }
  }
}


// ==================== 喇叭按鈕繪製與點擊 ====================

// 喇叭按鈕是一個獨立的圓形，不放在圖卡裡面。
function drawSpeakerButton(button) {
  const actualY = mouseY + (page === "result" ? scrollY : 0);
  const hovering =
    mouseX >= button.x && mouseX <= button.x + button.w &&
    actualY >= button.y && actualY <= button.y + button.h;

  push();
  translate(button.x + button.w / 2, button.y + button.h / 2);
  scale(hovering ? 1.08 : 1);

  noStroke();
  fill(WHITE);
  circle(0, 0, button.w);
  stroke(BLUE);
  strokeWeight(2);
  noFill();
  circle(0, 0, button.w);

  // 喇叭本體
  noStroke();
  fill(INK);
  beginShape();
  vertex(-11, -5);
  vertex(-5, -5);
  vertex(3, -12);
  vertex(3, 12);
  vertex(-5, 5);
  vertex(-11, 5);
  endShape(CLOSE);

  // 聲波線
  noFill();
  stroke(INK);
  strokeWeight(2);
  arc(2, 0, 16, 16, -PI / 3, PI / 3);
  arc(2, 0, 24, 24, -PI / 3, PI / 3);
  pop();
}

// 以目前畫面座標判斷按鈕點擊；成績頁需加上垂直捲動量。
function isInsideAudioButton(button, fixedToScreen = false) {
  if (!button) return false;
  const actualY = fixedToScreen ? mouseY : mouseY + scrollY;
  return (
    mouseX >= button.x && mouseX <= button.x + button.w &&
    actualY >= button.y && actualY <= button.y + button.h
  );
}


// ==================== 二十一、滑鼠點擊 ====================

function mousePressed() {
  // 答題頁右上角喇叭優先處理，避免誤選答案。
  if (page === "quiz" && isInsideAudioButton(quizAudioButton, true)) {
    playInstrumentSound(questions[currentQuestion].answer);
    return;
  }

  // 成績頁每張圖卡旁的喇叭優先處理，避免觸發卡片翻面。
  if (page === "result") {
    for (let i = 0; i < resultAudioButtons.length; i++) {
      if (isInsideAudioButton(resultAudioButtons[i], false)) {
        playInstrumentSound(i);
        return;
      }
    }
  }

  if (page === "cover") {
    if (isInside(startButton)) {
      startGame();
    }

    return;
  }

  if (page === "quiz") {
    // 已經作答後，才允許進入下一題或成績頁
    if (hasAnswered) {
      if (
        currentQuestion === 7 &&
        isInside(resultButton)
      ) {
        stopInstrumentSound();
        page = "result";
        scrollY = 0;
        confetti = [];
        flipProgress = Array(8).fill(0);
        resultAudioButtons = Array(8).fill(null);
      }

      else if (
        currentQuestion < 7 &&
        isInside(nextButton)
      ) {
        nextQuestion();
      }

      return;
    }

    // 尚未作答時，檢查點擊哪個選項
    for (let i = 0; i < optionRects.length; i++) {
      if (isInside(optionRects[i])) {
        selectAnswer(i);
        return;
      }
    }

    return;
  }

  if (page === "result") {
    if (isInside(retryButton)) {
      restartGame();
    }
  }
}


// 判斷滑鼠是否位於指定區域
function isInside(r) {
  if (!r || r.w === undefined) {
    return false;
  }

  let actualY = mouseY + scrollY;

  return (
    mouseX >= r.x &&
    mouseX <= r.x + r.w &&
    actualY >= r.y &&
    actualY <= r.y + r.h
  );
}


// ==================== 二十二、作答 ====================

function selectAnswer(choiceIndex) {
  if (hasAnswered) return;

  selectedAnswer = choiceIndex;
  hasAnswered = true;

  let q = questions[currentQuestion];
  let chosenInstrument = q.choices[choiceIndex];

  let correct = chosenInstrument === q.answer;

  answers[currentQuestion] = correct;

  if (correct) {
    score++;

    // 答對時出現彩帶
    spawnConfetti();
  } else {
    // 答錯時震動整個畫面，正確選項也會在自己的位置上下晃動
    confetti = [];
    shakeAmount = 8;
  }
}


// ==================== 二十三、下一題 ====================

function nextQuestion() {
  // 切換下一題時，立即停止上一題正在播放的音樂。
  stopInstrumentSound();

  // 清除上一題彩帶
  confetti = [];

  selectedAnswer = -1;
  hasAnswered = false;

  // 下一題從頂部開始
  scrollY = 0;

  if (currentQuestion < 7) {
    currentQuestion++;
  }
}


// ==================== 二十四、開始遊戲 ====================

function startGame() {
  stopInstrumentSound();

  page = "quiz";

  currentQuestion = 0;
  score = 0;
  answers = [];

  selectedAnswer = -1;
  hasAnswered = false;

  scrollY = 0;
  maxScroll = 0;
  confetti = [];

  setupQuestions();
}


// ==================== 二十五、重新遊玩 ====================

function restartGame() {
  stopInstrumentSound();

  page = "cover";

  currentQuestion = 0;
  score = 0;
  answers = [];

  selectedAnswer = -1;
  hasAnswered = false;

  scrollY = 0;
  maxScroll = 0;
  confetti = [];

  flipProgress = Array(8).fill(0);

  setupQuestions();
}


// ==================== 二十六、垂直捲動 ====================

function mouseWheel(event) {
  if (page === "quiz" || page === "result") {
    scrollY += event.delta;

    scrollY = constrain(
      scrollY,
      0,
      maxScroll
    );

    // 阻止瀏覽器預設捲動
    return false;
  }
}


// ==================== 二十七、鍵盤操作 ====================

function keyPressed() {
  // Enter 開始遊戲
  if (page === "cover" && key === "Enter") {
    startGame();
  }

  // 右方向鍵前往下一題
  if (page === "quiz" && hasAnswered) {
    if (keyCode === RIGHT_ARROW) {
      if (currentQuestion < 7) {
        nextQuestion();
      } else {
        stopInstrumentSound();
        page = "result";
        scrollY = 0;
        confetti = [];
        flipProgress = Array(8).fill(0);
        resultAudioButtons = Array(8).fill(null);
      }
    }
  }

  // Enter 重新遊玩
  if (page === "result" && key === "Enter") {
    restartGame();
  }

  // 上下方向鍵與 PageUp、PageDown 垂直捲動
  if (page === "quiz" || page === "result") {
    if (
      keyCode === DOWN_ARROW ||
      keyCode === 34
    ) {
      scrollY = min(
        scrollY + height * 0.65,
        maxScroll
      );
    }

    if (
      keyCode === UP_ARROW ||
      keyCode === 33
    ) {
      scrollY = max(
        scrollY - height * 0.65,
        0
      );
    }
  }
}
