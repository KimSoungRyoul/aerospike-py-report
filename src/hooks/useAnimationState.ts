import { useReducer, useCallback } from 'react';
import type { AnimationState, AnimationAction } from '../types';

const SPEEDS = [0.05, 0.1, 0.25, 0.5, 1];

const initialState: AnimationState = {
  playing: false,
  t: 0,
  speedMul: 1,
  spdIdx: 4,
};

function reducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, playing: true };
    case 'PAUSE':
      return { ...state, playing: false };
    case 'TOGGLE':
      return { ...state, playing: !state.playing };
    case 'TICK': {
      const newT = state.t + action.dt * state.speedMul * 0.85;
      return { ...state, t: newT };
    }
    case 'RESET':
      return { ...initialState };
    case 'SET_SPEED':
      return { ...state, speedMul: action.speedMul, spdIdx: action.spdIdx };
    case 'SEEK':
      return { ...state, t: action.t, playing: false };
    default:
      return state;
  }
}

export function useAnimationState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const toggle = useCallback(() => dispatch({ type: 'TOGGLE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const tick = useCallback(
    (dt: number) => dispatch({ type: 'TICK', dt }),
    [],
  );
  const seek = useCallback(
    (t: number) => dispatch({ type: 'SEEK', t }),
    [],
  );
  const nextSpeed = useCallback(() => {
    const nextIdx = (state.spdIdx + 1) % SPEEDS.length;
    dispatch({ type: 'SET_SPEED', spdIdx: nextIdx, speedMul: SPEEDS[nextIdx] });
  }, [state.spdIdx]);

  return { state, toggle, reset, tick, seek, nextSpeed };
}
