import type { BadScheduleItem, CanvasTheme, ScheduleMeta, HitRegion } from '../types';
import { rr, txt, drawDot, lerp, drawAerospikeCluster, drawNetworkLine } from './canvasHelpers';
import { GIL_HOLD_BAD } from '../utils/schedule';

/**
 * Draw one animation frame for the "bad" (CPython run_in_executor) panel.
 * Pure function — all dependencies are passed as parameters.
 */
export function drawBadFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  time: number,
  schedule: BadScheduleItem[],
  meta: ScheduleMeta,
  N: number,
  poolSize: number,
  C: CanvasTheme,
  hitRegions?: HitRegion[],
): void {
  // ── Shared layer positions (matches good panel) ──
  const cpY = 8;
  const netY = H - 100;
  const dbY = H - 52, dbH = 34;
  const usableH = netY - cpY - 12;
  const cpH = Math.floor(usableH * 0.55);
  const nativeY = cpY + cpH + 6;
  const nativeH = netY - nativeY - 6;

  // CPython internals
  const evY = cpY + 16, evH = 28;
  const gilBarY = evY + evH + 5;
  const gilBarH = 34;
  const poolTopY = gilBarY + gilBarH + 5;
  const showSlots = Math.min(Math.min(N, poolSize), 12);
  const poolAvail = cpY + cpH - poolTopY - 4;
  const slotH = Math.max(10, Math.min(20, (poolAvail - 14) / showSlots - 2));
  const poolH = showSlots * (slotH + 2) + 14;

  const hasQueue = N > poolSize;
  const queueW = hasQueue ? 52 : 0;
  const poolX = 10 + queueW;
  const poolW = W - 20 - queueW;

  // Native Thread Layer internals (PyTorch right 30%)
  const ptGap = 6;
  const totalW = W - 16;
  const pytorchW = Math.floor(totalW * 0.30 - ptGap / 2);
  const pytorchX = W - 8 - pytorchW;
  const nContentY = nativeY + 14;
  const nContentH = nativeH - 18;

  // ── Current contention stats ──
  const contending = schedule.filter(
    (s) => time >= s.gilReAcqT && time < s.gilGotT,
  ).length;
  const gilOwner = schedule.find(
    (s) => time >= s.gilGotT && time < s.convertT + 0.005,
  );
  const totalContenders = contending + (gilOwner ? 1 : 0);

  // ── CPython Interpreter boundary ──
  rr(ctx, 4, cpY, W - 8, cpH, 7, 'rgba(59,130,246,.06)', 'rgba(59,130,246,.55)', 2);
  txt(ctx, 10, cpY + 9, 'CPython Interpreter', '#60a5fa', 7.5, 'left', '600');

  // ── Event Loop ──
  const evStalling =
    time >= meta.badEvStallStart && time <= meta.badEvStallEnd;
  const stallElapsed = evStalling
    ? Math.min(time - meta.badEvStallStart, meta.badEvStallEnd - meta.badEvStallStart)
    : 0;

  if (evStalling) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 25);
    const aFill = (0.08 + pulse * 0.08).toFixed(3);
    const aStroke = (0.4 + pulse * 0.3).toFixed(2);
    rr(ctx, 10, evY, W - 20, evH, 5,
      'rgba(239,68,68,' + aFill + ')',
      'rgba(239,68,68,' + aStroke + ')', 2);
  } else {
    rr(ctx, 10, evY, W - 20, evH, 5,
      'rgba(6,182,212,.06)', 'rgba(6,182,212,.5)', 1.5);
  }

  txt(ctx, W / 2, evY + 11, 'asyncio Event Loop',
    evStalling ? C.gil : C.ev, 10, 'center', 'bold');

  if (evStalling) {
    txt(ctx, W / 2 - 40, evY + 22, '⛔ GIL 대기 — 서버 정지',
      C.gil, 8, 'center', 'bold');
    txt(ctx, W - 40, evY + 22,
      'stall: ' + stallElapsed.toFixed(2) + 'ms',
      C.gil, 7.5, 'right', '600');
  } else {
    txt(ctx, W / 2, evY + 22, '● 활성', C.ev, 7.5, 'center');
  }

  // ── GIL Contention Bar (enhanced) ──
  const gilIntense = totalContenders > 2;
  rr(ctx, 10, gilBarY, W - 20, gilBarH, 5,
    gilIntense ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.03)',
    gilIntense ? 'rgba(239,68,68,.6)' : 'rgba(239,68,68,.25)', 1.5);

  // Title
  const gLabel = gilOwner
    ? '🔒 GIL — T' + (gilOwner.inBatch + 1) + ' holding (R' + (gilOwner.i + 1) + ' → dict)'
    : contending > 0
      ? '🔒 GIL — ' + contending + '개 스레드 경합 중'
      : '🔓 GIL — idle';
  txt(ctx, W / 2, gilBarY + 11, gLabel,
    totalContenders > 1 ? C.gil : C.tx3, 8, 'center',
    totalContenders > 1 ? 'bold' : '');

  // Pressure bar
  const barX = 14, barW = W - 28, barY2 = gilBarY + 17, barH2 = 8;
  rr(ctx, barX, barY2, barW, barH2, 3, 'rgba(30,40,60,.2)');
  if (totalContenders > 0) {
    const peakInBatch = Math.min(N, poolSize);
    const fillRatio = totalContenders / Math.max(peakInBatch, 1);
    const fillW = barW * Math.min(fillRatio, 1);
    const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    grad.addColorStop(0, 'rgba(239,68,68,.3)');
    grad.addColorStop(1, 'rgba(239,68,68,.6)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY2, fillW, barH2, 3);
    ctx.fill();
    if (totalContenders > 3) {
      const shimmer = 0.15 + 0.1 * Math.sin(time * 40);
      ctx.fillStyle = 'rgba(255,255,255,' + shimmer + ')';
      ctx.beginPath();
      ctx.roundRect(barX, barY2, fillW * 0.3, barH2, 3);
      ctx.fill();
    }
  }
  txt(ctx, barX + 3, barY2 + 6,
    '경합: ' + totalContenders + '/' + Math.min(N, poolSize),
    totalContenders > 2 ? C.gil : C.tx3, 7, 'left', 'bold');

  // Serial stats
  const serialSoFar = schedule.filter((s) => time >= s.gilGotT).length;
  const serialTime = (serialSoFar * GIL_HOLD_BAD).toFixed(2);
  txt(ctx, W / 2, gilBarY + gilBarH - 4,
    '직렬 처리: ' + serialSoFar + '/' + N + ' (' + serialTime + 'ms) │ 1회 ~40μs',
    totalContenders > 0 ? '#f8a0a0' : C.tx3, 7, 'center');

  // ── Queue ──
  if (hasQueue) {
    const qH = poolH;
    rr(ctx, 10, poolTopY, queueW - 3, qH, 5,
      'rgba(244,114,182,.04)', 'rgba(244,114,182,.4)', 1.5);
    txt(ctx, 10 + (queueW - 3) / 2, poolTopY + 10, 'Queue',
      C.q, 8, 'center', 'bold');

    const queued = schedule.filter((s) => s.queued);
    const maxQ = Math.floor((qH - 18) / 7);
    queued.slice(0, maxQ).forEach((s, qi) => {
      const qy = poolTopY + 17 + qi * 7;
      const isWaiting = time >= 0.02 && time < s.dispatchT;
      rr(ctx, 13, qy, queueW - 9, 6, 2,
        isWaiting ? 'rgba(244,114,182,.15)' : 'rgba(30,40,60,.15)',
        isWaiting ? 'rgba(244,114,182,.4)' : 'rgba(26,37,69,.15)');
      if (isWaiting) {
        txt(ctx, 13 + (queueW - 9) / 2, qy + 5,
          'R' + (s.i + 1), C.q, 5.5, 'center', 'bold');
      }
    });
    if (queued.length > maxQ) {
      txt(ctx, 10 + (queueW - 3) / 2, poolTopY + qH - 5,
        '+' + (queued.length - maxQ), C.q, 7, 'center');
    }
    const waitingNow = schedule.filter(
      (s) => s.queued && time >= 0.02 && time < s.dispatchT,
    ).length;
    if (waitingNow > 0) {
      txt(ctx, 10 + (queueW - 3) / 2, poolTopY + qH + 9,
        waitingNow + ' blocked', C.q, 7.5, 'center', 'bold');
    }
  }

  // ── Thread Pool ──
  rr(ctx, poolX, poolTopY, poolW, poolH, 5,
    'rgba(30,40,60,.15)', 'rgba(30,42,72,.35)', 1.5);
  txt(ctx, poolX + poolW / 2, poolTopY + 9,
    'ThreadPool (' + poolSize + ')', C.tx3, 8, 'center');

  const hiddenSlots = Math.min(N, poolSize) - showSlots;

  type SlotPhase = 'dispatch' | 'gil_acq' | 'sending' | 'io_wait' | 'gil_wait' | 'converting' | 'done' | 'empty';

  for (let si = 0; si < showSlots; si++) {
    const slotY2 = poolTopY + 14 + si * (slotH + 2);
    const sx = poolX + 4, slotW2 = poolW - 8;

    const active = schedule.filter(
      (s) => s.inBatch === si && time >= s.dispatchT && time < s.doneT,
    );
    const s = active.length > 0 ? active[0] : null;

    let phase: SlotPhase = 'empty';
    let col = C.tx3;
    if (s) {
      if (time < s.gilAcqT) { phase = 'dispatch'; col = C.ev; }
      else if (time < s.gilRelT) { phase = 'gil_acq'; col = C.py; }
      else if (time < s.ioSendT) { phase = 'sending'; col = C.io; }
      else if (time < s.ioRecvT) { phase = 'io_wait'; col = C.io; }
      else if (time < s.gilGotT) { phase = 'gil_wait'; col = C.gil; }
      else if (time < s.convertT + 0.005) { phase = 'converting'; col = C.gil; }
      else { phase = 'done'; col = C.ok; }
    }

    const isContending = phase === 'gil_wait';
    rr(ctx, sx, slotY2, slotW2, slotH, 3,
      isContending
        ? 'rgba(239,68,68,.12)'
        : phase === 'io_wait'
          ? 'rgba(59,130,246,.06)'
          : 'rgba(20,30,50,.18)',
      isContending
        ? 'rgba(239,68,68,.6)'
        : s ? col + '66' : 'rgba(26,37,69,.25)', 1.2);

    const sz2 = Math.min(8.5, slotH - 3);
    if (s) {
      const labels: Record<string, string> = {
        dispatch: '→',
        gil_acq: 'GIL',
        sending: 'send',
        io_wait: 'recv()',
        gil_wait: '⚠GIL!',
        converting: '→dict',
        done: '✓',
      };
      txt(ctx, sx + 3, slotY2 + slotH / 2 + 2,
        'T' + (si + 1), col, sz2, 'left', 'bold');
      txt(ctx, sx + slotW2 - 3, slotY2 + slotH / 2 + 2,
        'R' + (s.i + 1) + ' ' + labels[phase],
        phase === 'gil_wait' ? C.gil : C.tx3, sz2 - 1, 'right');
    } else {
      txt(ctx, sx + 3, slotY2 + slotH / 2 + 2,
        'T' + (si + 1), C.tx3 + '44', sz2, 'left');
    }

    // Packet dots
    if (s) {
      const dotR = 2.2;
      const cx2 = sx + slotW2 / 2;

      if (time >= s.gilRelT && time < s.ioSendT) {
        drawDot(ctx, cx2,
          lerp(poolTopY + poolH, netY, (time - s.gilRelT) / (s.ioSendT - s.gilRelT)),
          dotR, C.io, true);
      }
      const ioHalf = s.ioRecvT - s.ioSendT;
      if (time >= s.ioSendT && time < s.ioSendT + ioHalf * 0.35) {
        drawDot(ctx, cx2,
          lerp(netY, dbY, (time - s.ioSendT) / (ioHalf * 0.35)),
          dotR, C.io, true);
      }
      if (time >= s.ioSendT + ioHalf * 0.55 && time < s.ioRecvT) {
        const ts2 = s.ioSendT + ioHalf * 0.55;
        drawDot(ctx, cx2,
          lerp(dbY, poolTopY + poolH, (time - ts2) / (s.ioRecvT - ts2)),
          dotR, C.db, true);
      }
      if (phase === 'gil_wait' && Math.sin(time * 50) > 0) {
        drawDot(ctx, cx2, poolTopY + poolH - 3, 2, C.db, true);
      }
    }
  }

  if (hiddenSlots > 0) {
    txt(ctx, poolX + poolW / 2, poolTopY + poolH - 3,
      '+' + hiddenSlots + ' threads (not shown)', C.tx3, 7, 'center');
  }

  // ── Network ──
  drawNetworkLine(ctx, W, netY, C);

  // ── Aerospike ──
  drawAerospikeCluster(ctx, W, dbY, dbH, C);

  // ── Native Thread Layer boundary ──
  rr(ctx, 4, nativeY, W - 8, nativeH, 7, 'rgba(30,40,60,.08)', 'rgba(30,42,72,.3)', 1.5);
  txt(ctx, 10, nativeY + 9, 'Native Thread Layer', C.tx3, 7.5, 'left', '600');

  // ── PyTorch Native Threads (right 30%, inside Native Thread Layer) ──
  {
    const inferActive = time >= meta.badInferStart;
    const p = inferActive
      ? Math.min(1, (time - meta.badInferStart) / (meta.badInferEnd - meta.badInferStart))
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
      txt(ctx, pytorchX + pytorchW / 2, nContentY + 36,
        'Inference ' + (p * 100).toFixed(0) + '%', C.cpu, 8.5, 'center', '700');

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
  }

  // ── GIL zone overlay ──
  if (time > meta.badEvStallStart && time < meta.badEvStallEnd) {
    ctx.fillStyle = 'rgba(239,68,68,.012)';
    ctx.fillRect(0, evY, W, poolTopY + poolH - evY);
  }

  // ── Hit regions for tooltip support ──
  if (hitRegions) {
    hitRegions.push({
      id: 'bad-ev',
      x: 10, y: evY, w: W - 20, h: evH,
      tooltip: evStalling
        ? 'Event Loop 정지 중 (GIL 대기) — stall: ' + stallElapsed.toFixed(2) + 'ms'
        : 'asyncio Event Loop — 활성',
    });
    hitRegions.push({
      id: 'bad-gil',
      x: 10, y: gilBarY, w: W - 20, h: gilBarH,
      tooltip: 'GIL 경합: ' + totalContenders + '/' + Math.min(N, poolSize)
        + ' │ 직렬 처리: ' + serialSoFar + '/' + N,
    });
    hitRegions.push({
      id: 'bad-pool',
      x: poolX, y: poolTopY, w: poolW, h: poolH,
      tooltip: 'ThreadPool (' + poolSize + ') — ' + showSlots + ' slots shown',
    });
    if (hasQueue) {
      hitRegions.push({
        id: 'bad-queue',
        x: 10, y: poolTopY, w: queueW - 3, h: poolH,
        tooltip: 'Queue — blocking 대기 중인 요청',
      });
    }
  }
}

/**
 * Compute the status HTML string for the "bad" panel at a given time.
 */
export function getBadStatus(
  time: number,
  schedule: BadScheduleItem[],
  meta: ScheduleMeta,
  _N: number,
  C: CanvasTheme,
): string {
  const contending = schedule.filter(
    (s) => time >= s.gilReAcqT && time < s.gilGotT,
  ).length;

  const evStalling =
    time >= meta.badEvStallStart && time <= meta.badEvStallEnd;
  const stallElapsed = evStalling
    ? Math.min(time - meta.badEvStallStart, meta.badEvStallEnd - meta.badEvStallStart)
    : 0;

  const queuedNow = schedule.filter(
    (s) => s.queued && time >= 0.02 && time < s.dispatchT,
  ).length;
  const contendNow = contending;

  if (time < 0.02) {
    return '대기 중...';
  }
  if (queuedNow > 0 && contendNow > 0) {
    return '<b class="p">⏳ ' + queuedNow + '개 큐 대기</b> + '
      + '<b class="r">⚠ ' + contendNow + '개 GIL 경합 — 이벤트 루프 정지</b>';
  }
  if (queuedNow > 0) {
    return '<b class="p">⏳ ' + queuedNow + '개 요청이 ThreadPool 큐에서 blocking 대기</b>';
  }
  if (contendNow > 0) {
    return '<b class="r">⚠ GIL ' + contendNow + '-way 경합! 이벤트 루프 stall '
      + stallElapsed.toFixed(2) + 'ms</b>';
  }
  if (time < meta.badAllDone) {
    return '<b class="b">→ I/O 처리 중</b>';
  }
  if (time < meta.badInferEnd) {
    return '<b style="color:' + C.cpu + '">🔥 PyTorch model.predict()</b>';
  }
  return '<b class="r">완료: ' + meta.badInferEnd.toFixed(2) + 'ms</b>';
}
