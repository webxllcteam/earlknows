import * as migration_20260911_134505_initial from './20260911_134505_initial';
import * as migration_20260911_141500_seed_idaho from './20260911_141500_seed_idaho';
import * as migration_20260911_153000_applications_market from './20260911_153000_applications_market';
import * as migration_20260911_173000_service_parent from './20260911_173000_service_parent';

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
  {
    up: migration_20260911_153000_applications_market.up,
    down: migration_20260911_153000_applications_market.down,
    name: '20260911_153000_applications_market'
  },
  {
    up: migration_20260911_173000_service_parent.up,
    down: migration_20260911_173000_service_parent.down,
    name: '20260911_173000_service_parent'
  },
];
