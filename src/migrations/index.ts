import * as migration_20260911_134505_initial from './20260911_134505_initial';

export const migrations = [
  {
    up: migration_20260911_134505_initial.up,
    down: migration_20260911_134505_initial.down,
    name: '20260911_134505_initial'
  },
];
