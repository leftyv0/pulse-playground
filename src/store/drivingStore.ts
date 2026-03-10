import { create } from "zustand";

interface DrivingState {
  /** Current forward speed of the car (units/sec) */
  speed: number;
  /** Normalized speed 0..1 (fraction of max speed) */
  speedNormalized: number;
  /** Current lateral velocity */
  lateralVelocity: number;

  setDriving: (speed: number, speedNormalized: number, lateralVelocity: number) => void;
}

export const useDrivingStore = create<DrivingState>()((set) => ({
  speed: 0,
  speedNormalized: 0,
  lateralVelocity: 0,
  setDriving: (speed, speedNormalized, lateralVelocity) =>
    set({ speed, speedNormalized, lateralVelocity }),
}));
