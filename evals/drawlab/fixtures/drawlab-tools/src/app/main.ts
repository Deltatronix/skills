import { createBoardPage } from './pages/board/BoardPage.ts';
import { createFootprintPage } from './pages/footprint/FootprintPage.ts';
import { createSchematicPage } from './pages/schematic/SchematicPage.ts';
import { createSketchPage } from './pages/sketch/SketchPage.ts';

/** Route → page factory. The shell mounts `pages[route]().render()` into #app. */
export const pages = {
  sketch: createSketchPage,
  schematic: createSchematicPage,
  board: createBoardPage,
  footprint: createFootprintPage,
};
