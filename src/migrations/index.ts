import * as migration_20260911_134505_initial from './20260911_134505_initial';
import * as migration_20260911_141500_seed_idaho from './20260911_141500_seed_idaho';

export const migrations = [
  {
    up: migration_20260911_134505_initial.up,
    down: migration_20260911_134505_initial.down,
    name: '20260911_134505_initial'
  },
  {
    up: migration_20260911_141500_seed_idaho.up,
    down: migration_20260911_141500_seed_idaho.down,
    name: '20260911_141500_seed_idaho'
  },
];
