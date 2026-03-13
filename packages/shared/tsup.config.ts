import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: 'src/index.ts',
    contracts: 'src/contracts/index.ts',
    enums: 'src/enums.ts',
    schemas: 'src/schemas/index.ts',
  },
  format: ['esm', 'cjs'],
  sourcemap: true,
  target: 'es2021',
});
