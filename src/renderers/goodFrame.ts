import type { GoodScheduleItem, CanvasTheme, ScheduleMeta, HitRegion } from '../types';
import { rr, txt, drawDot, lerp, drawAerospikeCluster, drawNetworkLine } from './canvasHelpers';

export function drawGoodFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  time: number,
  schedule: GoodScheduleItem[],
  meta: ScheduleMeta,
  _N: number,
  tokioWorkers: number,
  C: CanvasTheme,
  hitRegions?: HitRegion[],
): void {
  const { goodInferStart, goodInferEnd } = meta;

  // ── Shared layer positions (matches bad panel) ──
  const cpY = 8;
  const netY = H - 100;
  const dbY = H - 52, dbH = 34;
  const usableH = netY - cpY - 12;
  const cpH = Math.floor(usableH * 0.55);
  const nativeY = cpY + cpH + 6;
  const nativeH = netY - nativeY - 6;

  // CPython internals
  const evY = cpY + 16, evH = 28;
  const brY = evY + evH + 5, brH = 16;

  // Native Thread Layer internals
  const nContentY = nativeY + 14;
  const nContentH = nativeH - 18;
  const ptGap = 6;
  const totalW = W - 16;
  const tokioW = Math.floor(totalW * 0.70 - ptGap / 2);
  const pytorchW = totalW - tokioW - ptGap;
  const tokioX = 8;
  const pytorchX = tokioX + tokioW + ptGap;

  // ── CPython Interpreter boundary ──
  rr(ctx, 4, cpY, W - 8, cpH, 6, 'rgba(59,130,246,.06)', 'rgba(59,130,246,.55)', 2);
  txt(ctx, 10, cpY + 9, 'CPython Interpreter', '#60a5fa', 7.5, 'left', '600');

  // ── Event Loop (inside CPython — always active, no GIL contention) ──
  rr(ctx, 10, evY, W - 20, evH, 5, 'rgba(6,182,212,.06)', 'rgba(6,182,212,.5)', 1.5);
  txt(ctx, W / 2, evY + 10, 'asyncio Event Loop', C.ev, 9.5, 'center', 'bold');
  txt(ctx, W / 2, evY + 21, '● 항상 활성 — GIL 경합 없음', C.ev, 7, 'center');

  if (hitRegions) {
    hitRegions.push({
      id: 'good-ev-loop',
      x: 10, y: evY, w: W - 20, h: evH,
      tooltip: 'asyncio Event Loop — 항상 활성 (GIL 경합 없음)',
    });
  }

  // ── PyO3 bridge (inside CPython) ──
  rr(ctx, 10, brY, W - 20, brH, 3, 'rgba(222,165,132,.04)', 'rgba(222,165,132,.3)', 1.5);
  txt(ctx, W / 2, brY + 9, 'PyO3 → Tokio spawn (GIL 즉시 해제)', C.rs, 7.5, 'center');

  if (hitRegions) {
    hitRegions.push({
      id: 'good-pyo3-bridge',
      x: 10, y: brY, w: W - 20, h: brH,
      tooltip: 'PyO3 브릿지 — GIL을 즉시 해제하고 Tokio에 spawn',
    });
  }

  // ── GIL touch indicator (inside CPython) ──
  const touching = schedule.filter(s => time >= s.gilTouchT && time < s.gilDoneT);
  if (touching.length > 0) {
    rr(ctx, W / 2 - 38, brY + 1, 76, 9, 3,
      'rgba(16,185,129,.06)', 'rgba(16,185,129,.2)');
    txt(ctx, W / 2, brY + 7,
      'GIL ~12μs (F' + (touching[0].i + 1) + ')', C.ok, 6, 'center', 'bold');
  }

  // ── Native / OS Thread Layer boundary ──
  rr(ctx, 4, nativeY, W - 8, nativeH, 7, 'rgba(30,40,60,.08)', 'rgba(30,42,72,.3)', 1.5);
  txt(ctx, 10, nativeY + 9, 'Native Thread Layer', C.tx3, 7.5, 'left', '600');

  // ── Tokio Runtime (left 70%) ──
  rr(ctx, tokioX, nContentY, tokioW, nContentH, 5,
    'rgba(249,115,22,.04)', 'rgba(249,115,22,.4)', 2);
  txt(ctx, tokioX + 6, nContentY + 10, 'Tokio Runtime', C.tokio, 8, 'left', 'bold');

  if (hitRegions) {
    hitRegions.push({
      id: 'good-tokio-runtime',
      x: tokioX, y: nContentY, w: tokioW, h: nContentH,
      tooltip: 'Tokio 비동기 런타임 — GIL 없이 네이티브 스레드에서 실행',
    });
  }

  // Worker columns inside Tokio
  const wY = nContentY + 22;
  const wH = nContentH - 26;
  const wW = (tokioW - 8 - 3 * (tokioWorkers - 1)) / tokioWorkers;
  const tasksByW: GoodScheduleItem[][] = Array.from({ length: tokioWorkers }, () => []);
  schedule.forEach((s, i) => tasksByW[i % tokioWorkers].push(s));

  for (let wi = 0; wi < tokioWorkers; wi++) {
    const wx = tokioX + 4 + (wW + 3) * wi;
    const tasks = tasksByW[wi];
    const active = tasks.some(s => time >= s.spawnT && time < s.doneT);

    rr(ctx, wx, wY, wW, wH, 4,
      active ? 'rgba(249,115,22,.06)' : 'rgba(20,30,50,.12)',
      active ? 'rgba(249,115,22,.4)' : 'rgba(26,37,69,.2)', 1.5);
    txt(ctx, wx + wW / 2, wY + 9, 'W' + (wi + 1), C.tokio, 8.5, 'center', 'bold');

    // epoll label
    rr(ctx, wx + 3, wY + 14, wW - 6, 10, 2, 'rgba(249,115,22,.04)', 'rgba(249,115,22,.2)', 1.5);
    txt(ctx, wx + wW / 2, wY + 21, 'epoll', C.tokio, 6, 'center');

    // Task slots
    const taskSlotH = Math.max(6, Math.min(14, (wH - 30) / Math.max(tasks.length, 1) - 1));
    const maxShow = Math.floor((wH - 30) / (taskSlotH + 1));

    tasks.slice(0, maxShow).forEach((s, ti) => {
      const tY2 = wY + 28 + ti * (taskSlotH + 1);
      let col = C.tx3;
      let ph = 'idle';

      if (time >= s.spawnT && time < s.ioSendT) { ph = 'spawn'; col = C.tokio; }
      else if (time >= s.ioSendT && time < s.ioRecvT) { ph = 'io'; col = C.io; }
      else if (time >= s.ioRecvT && time < s.rustParseT) { ph = 'recv'; col = C.db; }
      else if (time >= s.rustParseT && time < s.gilTouchT) { ph = 'parse'; col = C.ok; }
      else if (time >= s.gilTouchT && time < s.gilDoneT) { ph = 'gil'; col = C.ok; }
      else if (time >= s.doneT) { ph = 'done'; col = C.ok; }

      rr(ctx, wx + 3, tY2, wW - 6, taskSlotH, 2,
        ph !== 'idle' ? col + '18' : 'rgba(20,30,50,.12)',
        ph !== 'idle' ? col + '55' : 'rgba(26,37,69,.15)', 1.2);

      if (taskSlotH >= 8) {
        txt(ctx, wx + 5, tY2 + taskSlotH / 2 + 2,
          'F' + (s.i + 1), col,
          Math.min(7, taskSlotH - 2), 'left',
          ph !== 'idle' ? 'bold' : '');
      }

      if (hitRegions) {
        hitRegions.push({
          id: `good-task-${s.i}`,
          x: wx + 3, y: tY2, w: wW - 6, h: taskSlotH,
          tooltip: `F${s.i + 1}: ${ph}`,
        });
      }
    });

    if (tasks.length > maxShow) {
      txt(ctx, wx + wW / 2, wY + wH - 3,
        '+' + (tasks.length - maxShow), C.tokio, 6, 'center');
    }

    // ── Packet dots ──
    tasks.forEach(s => {
      const dotR = 2.2;
      const cx2 = wx + wW / 2;

      // Spawn → network
      if (time >= s.spawnT && time < s.ioSendT) {
        drawDot(ctx, cx2,
          lerp(wY + wH, netY, (time - s.spawnT) / (s.ioSendT - s.spawnT)),
          dotR, C.io, true);
      }

      // Send to DB
      const ioH = s.ioRecvT - s.ioSendT;
      if (time >= s.ioSendT && time < s.ioSendT + ioH * 0.35) {
        drawDot(ctx, cx2,
          lerp(netY, dbY, (time - s.ioSendT) / (ioH * 0.35)),
          dotR, C.io, true);
      }

      // Receive from DB
      if (time >= s.ioSendT + ioH * 0.55 && time < s.ioRecvT) {
        const ts2 = s.ioSendT + ioH * 0.55;
        drawDot(ctx, cx2,
          lerp(dbY, wY + wH, (time - ts2) / (s.ioRecvT - ts2)),
          dotR, C.db, true);
      }
    });
  }

  // ── PyTorch Native Threads (right 30%) ──
  {
    const inferActive = time >= goodInferStart;
    const p = inferActive
      ? Math.min(1, (time - goodInferStart) / (goodInferEnd - goodInferStart))
      : 0;

    const pulse = inferActive ? 0.03 + 0.015 * Math.sin(time * 18) : 0.02;
    ctx.save();
    if (inferActive) {
      ctx.shadowColor = 'rgba(168,85,247,.25)';
      ctx.shadowBlur = 10;
    }
    rr(ctx, pytorchX, nContentY, pytorchW, nContentH, 5,
      'rgba(168,85,247,' + pulse + ')',
      inferActive ? 'rgba(168,85,247,.5)' : 'rgba(168,85,247,.2)', 2);
    ctx.restore();

    txt(ctx, pytorchX + pytorchW / 2, nContentY + 10,
      '🔥 PyTorch Native Threads', C.cpu, 7.5, 'center', '700');
    txt(ctx, pytorchX + pytorchW / 2, nContentY + 21,
      '(GIL-free) C++ / CUDA', C.cpu, 6, 'center');

    if (inferActive) {
      // Progress label
      txt(ctx, pytorchX + pytorchW / 2, nContentY + 36,
        'Inference ' + (p * 100).toFixed(0) + '%', C.cpu, 8.5, 'center', '700');

      // 4 stages stacked vertically
      const stageLabels = ['matmul', 'ReLU', 'softmax', 'output'];
      const nStages = stageLabels.length;
      const stageGap = 4;
      const stageStartY = nContentY + 46;
      const stageAreaH = nContentH - 54;
      const stageH = (stageAreaH - (nStages - 1) * stageGap) / nStages;

      for (let si = 0; si < nStages; si++) {
        const sy = stageStartY + si * (stageH + stageGap);
        const isDone = p >= (si + 1) / nStages;
        const isActive = p > si / nStages && !isDone;

        const colFill = isDone
          ? 'rgba(168,85,247,.15)'
          : isActive ? 'rgba(168,85,247,.1)' : 'rgba(168,85,247,.03)';
        const bdr = isDone
          ? 'rgba(168,85,247,.3)'
          : isActive ? 'rgba(168,85,247,.22)' : 'rgba(168,85,247,.08)';

        rr(ctx, pytorchX + 4, sy, pytorchW - 8, stageH, 4, colFill, bdr, 1.5);

        txt(ctx, pytorchX + pytorchW / 2, sy + stageH / 2 + 2,
          stageLabels[si],
          isActive || isDone ? C.cpu : C.tx3, 7.5, 'center',
          isActive ? '700' : '');

        if (isActive) {
          const shimmer = 0.08 + 0.06 * Math.sin(time * 35 + si * 2);
          ctx.fillStyle = 'rgba(168,85,247,' + shimmer + ')';
          ctx.beginPath();
          ctx.roundRect(pytorchX + 4, sy, pytorchW - 8, stageH, 4);
          ctx.fill();
          // Progress bar at bottom of stage
          const localP = (p - si / nStages) * nStages;
          rr(ctx, pytorchX + 6, sy + stageH - 5,
            Math.max(0, (pytorchW - 12) * Math.min(localP, 1)), 3, 1.5,
            'rgba(168,85,247,.35)');
        }
        if (isDone) {
          txt(ctx, pytorchX + pytorchW - 12, sy + stageH / 2 + 2, '✓',
            C.ok, 7, 'center', 'bold');
        }
      }
    }

    if (hitRegions) {
      hitRegions.push({
        id: 'good-pytorch',
        x: pytorchX, y: nContentY, w: pytorchW, h: nContentH,
        tooltip: inferActive
          ? `PyTorch Inference — ${(p * 100).toFixed(0)}%`
          : 'PyTorch Native Threads (대기)',
      });
    }
  }

  // ── Network line ──
  drawNetworkLine(ctx, W, netY, C, '── TCP (연결 풀) ──');

  // ── Aerospike cluster ──
  drawAerospikeCluster(ctx, W, dbY, dbH, C);
}

export function getGoodStatus(
  time: number,
  schedule: GoodScheduleItem[],
  meta: ScheduleMeta,
  N: number,
  C: CanvasTheme,
): string {
  const { goodAllDone, goodInferEnd } = meta;
  const touching = schedule.filter(s => time >= s.gilTouchT && time < s.gilDoneT);

  if (time < 0.012) return '대기 중...';
  if (time < schedule[N - 1].spawnT) return '<b class="b">→ Tokio spawn</b> (' + N + '개 태스크)';
  if (time < schedule[0].ioRecvT) return '<b class="b">→ epoll async I/O</b> (' + N + '개 소켓 동시)';
  if (touching.length > 0) return '<b class="g">GIL 터치 ~12μs</b> 순차 변환 중';
  if (time < goodAllDone) return '<b class="g">Rust 파싱 중 (GIL 불필요)</b>';
  if (time < goodInferEnd) return '<b style="color:' + C.cpu + '">🔥 PyTorch model.predict()</b>';
  return '<b class="g">완료: ' + goodInferEnd.toFixed(2) + 'ms</b>';
}
